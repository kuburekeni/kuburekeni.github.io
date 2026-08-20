import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, Trash2, Bell, TrendingDown, Wallet, ListOrdered, LayoutGrid, AlertTriangle, Clock, CheckCircle2, Flame, Snowflake, Target, Calendar, Settings, Sun, Moon, Send, RefreshCw, Cloud, CloudOff, ChevronLeft } from "lucide-react";

// Local persistence shim — this app runs as a static site (e.g. GitHub Pages),
// so it uses the browser's localStorage instead of the claude.ai artifact
// storage API. Same shape ({ value }) so the rest of the app is unchanged.
const storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(`ledgerline:${key}`);
      return v === null ? null : { key, value: v };
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(`ledgerline:${key}`, value);
      return { key, value };
    } catch (e) {
      return null;
    }
  },
};

// ---------- constants ----------
const FREQ = { weekly: 4.345, fortnightly: 2.1725, monthly: 1 };
const FREQ_LABEL = { weekly: "wk", fortnightly: "f/n", monthly: "mo" };
const STORE_KEY = "ledgerline:v1";
const uid = () => Math.random().toString(36).slice(2, 10);

const THEMES = {
  dark: {
    bg: "#12151B", surface: "#1B1F27", border: "#2A2F3A",
    text: "#EDEDEE", muted: "#8A8F9C", muted2: "#565B68",
    accent: "#3EB489", danger: "#E15554", warning: "#E8A33D",
  },
  light: {
    bg: "#F4F5F7", surface: "#FFFFFF", border: "#DDE1E7",
    text: "#1B1E24", muted: "#5B6270", muted2: "#8A8F9C",
    accent: "#1E9B6E", danger: "#C7433F", warning: "#B8791C",
  },
};

// ---------- Telegram + Supabase helpers ----------
async function sendTelegram(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) {
    throw new Error((data && data.description) || `Telegram request failed (${res.status})`);
  }
  return data;
}

async function supabasePull(cfg) {
  const url = `${cfg.url.replace(/\/$/, "")}/rest/v1/${cfg.table}?id=eq.${encodeURIComponent(cfg.rowId)}&select=data`;
  const res = await fetch(url, {
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
  });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  const rows = await res.json();
  return rows && rows[0] ? rows[0].data : null;
}

async function supabasePush(cfg, data) {
  const url = `${cfg.url.replace(/\/$/, "")}/rest/v1/${cfg.table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([{ id: cfg.rowId, data, updated_at: new Date().toISOString() }]),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Supabase write failed (${res.status}) ${t}`.trim());
  }
}

function monthlyAmt(item) { return item.amount * FREQ[item.frequency]; }

function nextDueDate(dueDay, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), dueDay);
  if (d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}
function daysUntil(date) {
  const today = new Date(); today.setHours(0,0,0,0);
  const t = new Date(date); t.setHours(0,0,0,0);
  return Math.round((t - today) / 86400000);
}
function fmtMoney(n) {
  const s = Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "-$" : "$") + s;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

// ---------- goal math ----------
function monthsUntil(targetDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(targetDate); t.setHours(0, 0, 0, 0);
  const days = (t - today) / 86400000;
  return Math.max(days / 30.4368, 0.03);
}
// Required flat monthly payment to clear `balance` at monthly rate `r` within `months`.
function requiredMonthlyPayment(balance, apr, months) {
  const r = (apr / 100) / 12;
  if (balance <= 0) return 0;
  if (r <= 0) return balance / months;
  const n = months;
  const denom = 1 - Math.pow(1 + r, -n);
  if (denom <= 0) return balance / months; // target too close / rate too high, fall back
  return (balance * r) / denom;
}

// ---------- priority ordering ----------
function orderDebts(debts, strategy) {
  const arr = [...debts];
  if (strategy === "avalanche") arr.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
  else arr.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  return arr;
}

// ---------- payoff simulation ----------
function simulatePayoff(debts, extraMonthly, strategy) {
  let sim = debts.map(d => ({ ...d, balance: d.balance }));
  let months = 0, totalInterest = 0;
  const cap = 600;
  const startingTotal = sim.reduce((s, d) => s + d.balance, 0);
  if (startingTotal <= 0) return { months: 0, totalInterest: 0, history: [] };
  const history = [];
  while (sim.some(d => d.balance > 0.01) && months < cap) {
    months++;
    let freedUp = 0;
    // interest accrual
    sim = sim.map(d => {
      if (d.balance <= 0) return d;
      const interest = (d.apr / 100 / 12) * d.balance;
      totalInterest += interest;
      return { ...d, balance: d.balance + interest };
    });
    // min payments
    sim = sim.map(d => {
      if (d.balance <= 0) return d;
      const pay = Math.min(d.minPayment, d.balance);
      const bal = d.balance - pay;
      if (bal <= 0.01) freedUp += d.minPayment - pay; // if it clears early, remainder rolls into pool this month
      return { ...d, balance: Math.max(bal, 0) };
    });
    // extra payment (this month's dedicated extra, plus any minimums freed up from cleared debts)
    let pool = extraMonthly + freedUp;
    const order = orderDebts(sim.filter(d => d.balance > 0.01), strategy);
    for (const target of order) {
      if (pool <= 0) break;
      const idx = sim.findIndex(d => d.id === target.id);
      const pay = Math.min(pool, sim[idx].balance);
      sim[idx] = { ...sim[idx], balance: sim[idx].balance - pay };
      pool -= pay;
    }
    history.push({ month: months, remaining: sim.reduce((s, d) => s + Math.max(d.balance, 0), 0) });
  }
  return { months, totalInterest, history };
}

// ---------- reusable bits ----------
function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">{label}</span>
      <input
        {...props}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--muted2)]"
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">{label}</span>
      <select
        {...props}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
      >
        {children}
      </select>
    </label>
  );
}

function StatusPill({ days }) {
  let color = "var(--accent)", label = `in ${days}d`, Icon = Clock;
  if (days < 0) { color = "var(--danger)"; label = `${Math.abs(days)}d overdue`; Icon = AlertTriangle; }
  else if (days === 0) { color = "var(--warning)"; label = "due today"; Icon = Bell; }
  else if (days <= 7) { color = "var(--warning)"; label = `in ${days}d`; Icon = Clock; }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)` }}>
      <Icon size={11} /> {label}
    </span>
  );
}

const DEFAULT_SETTINGS = {
  themeMode: "system", // 'system' | 'dark' | 'light'
  supaUrl: "", supaKey: "", supaTable: "finance_state", supaRowId: "default",
  tgToken: "", tgChatId: "",
};

export default function LedgerLine() {
  const [loaded, setLoaded] = useState(false);
  const [prevTab, setPrevTab] = useState("overview");
  const [tab, setTab] = useState("overview");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [strategy, setStrategy] = useState("avalanche");
  const [bufferAmt, setBufferAmt] = useState(0);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [systemDark, setSystemDark] = useState(true);
  const [syncStatus, setSyncStatus] = useState("local"); // local | syncing | synced | error
  const [syncError, setSyncError] = useState("");
  const [tgStatus, setTgStatus] = useState("idle"); // idle | sending | sent | error
  const [tgError, setTgError] = useState("");
  const pushTimer = useRef(null);
  const firstSyncDone = useRef(false);

  const supaConfigured = !!(settings.supaUrl && settings.supaKey && settings.supaTable && settings.supaRowId);
  const tgConfigured = !!(settings.tgToken && settings.tgChatId);

  const theme = settings.themeMode === "system" ? (systemDark ? "dark" : "light") : settings.themeMode;
  const colors = THEMES[theme];

  // watch system color scheme
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler); };
  }, []);

  // load local, then settings, then try supabase pull
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("state");
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setIncomes(parsed.incomes || []);
          setExpenses(parsed.expenses || []);
          setDebts(parsed.debts || []);
          setStrategy(parsed.strategy || "avalanche");
          setBufferAmt(parsed.bufferAmt || 0);
        }
      } catch (e) { /* no local state yet */ }

      let loadedSettings = DEFAULT_SETTINGS;
      try {
        const sres = await storage.get("settings");
        if (sres && sres.value) loadedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(sres.value) };
      } catch (e) { /* no settings yet */ }
      setSettings(loadedSettings);

      const cfg = {
        url: loadedSettings.supaUrl, anonKey: loadedSettings.supaKey,
        table: loadedSettings.supaTable, rowId: loadedSettings.supaRowId,
      };
      if (cfg.url && cfg.anonKey && cfg.table && cfg.rowId) {
        setSyncStatus("syncing");
        try {
          const remote = await supabasePull(cfg);
          if (remote) {
            setIncomes(remote.incomes || []);
            setExpenses(remote.expenses || []);
            setDebts(remote.debts || []);
            setStrategy(remote.strategy || "avalanche");
            setBufferAmt(remote.bufferAmt || 0);
          }
          setSyncStatus("synced");
        } catch (e) {
          setSyncStatus("error"); setSyncError(e.message || "Sync failed");
        }
      }
      firstSyncDone.current = true;
      setLoaded(true);
    })();
  }, []);

  // save app data: always local, debounce push to supabase if configured
  useEffect(() => {
    if (!loaded) return;
    const state = { incomes, expenses, debts, strategy, bufferAmt };
    storage.set("state", JSON.stringify(state)).catch(() => {});

    if (supaConfigured) {
      setSyncStatus("syncing");
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        const cfg = { url: settings.supaUrl, anonKey: settings.supaKey, table: settings.supaTable, rowId: settings.supaRowId };
        supabasePush(cfg, state)
          .then(() => setSyncStatus("synced"))
          .catch((e) => { setSyncStatus("error"); setSyncError(e.message || "Sync failed"); });
      }, 1200);
    } else {
      setSyncStatus("local");
    }
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomes, expenses, debts, strategy, bufferAmt, loaded]);

  // persist settings separately
  useEffect(() => {
    if (!loaded) return;
    storage.set("settings", JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const updateSettings = (patch) => setSettings(s => ({ ...s, ...patch }));

  const openSettings = () => { setPrevTab(tab); setTab("settings"); };
  const closeSettings = () => setTab(prevTab);

  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + monthlyAmt(i), 0), [incomes]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + monthlyAmt(e), 0), [expenses]);
  const totalMinPayments = useMemo(() => debts.reduce((s, d) => s + Number(d.minPayment || 0), 0), [debts]);
  const totalDebtBalance = useMemo(() => debts.reduce((s, d) => s + Number(d.balance || 0), 0), [debts]);
  const surplus = totalIncome - totalExpenses - totalMinPayments - Number(bufferAmt || 0);
  const extraForDebt = Math.max(surplus, 0);

  const priorityOrder = useMemo(() => orderDebts(debts, strategy), [debts, strategy]);
  const priorityTarget = priorityOrder[0];

  const debtsWithDue = useMemo(() => debts.map(d => {
    const due = nextDueDate(Number(d.dueDay));
    return { ...d, dueDate: due, days: daysUntil(due) };
  }).sort((a, b) => a.days - b.days), [debts]);

  const upcoming = debtsWithDue.filter(d => d.days <= 14);

  const payoff = useMemo(() => simulatePayoff(debts, extraForDebt, strategy), [debts, extraForDebt, strategy]);

  const goalDebts = useMemo(() => debts.filter(d => d.goalDate).map(d => {
    const months = monthsUntil(d.goalDate);
    const reqMonthly = requiredMonthlyPayment(Number(d.balance), Number(d.apr), months);
    const periodsPerMonth = FREQ[d.goalFreq] || 1;
    const reqPerPeriod = reqMonthly / periodsPerMonth;
    const shortfall = reqMonthly - Number(d.minPayment);
    return { ...d, months, reqMonthly, reqPerPeriod, shortfall };
  }), [debts]);
  const totalReqMonthly = goalDebts.reduce((s, d) => s + d.reqMonthly, 0);
  const totalShortfall = goalDebts.reduce((s, d) => s + Math.max(d.shortfall, 0), 0);

  const sendReminders = useCallback(async () => {
    if (!tgConfigured) return;
    setTgStatus("sending"); setTgError("");
    try {
      const lines = ["<b>Ledger Line — repayments due</b>"];
      if (upcoming.length === 0) {
        lines.push("Nothing due in the next 14 days.");
      } else {
        upcoming.forEach(d => {
          const tag = d.days < 0 ? `${Math.abs(d.days)}d overdue` : d.days === 0 ? "due today" : `in ${d.days}d`;
          lines.push(`• ${d.name || "Untitled debt"} — ${fmtMoney(d.minPayment)} — ${fmtDate(d.dueDate)} (${tag})`);
        });
      }
      if (priorityTarget && extraForDebt > 0) {
        lines.push("", `Priority target: ${priorityTarget.name || "Untitled debt"} — send an extra ${fmtMoney(extraForDebt)} this month.`);
      }
      await sendTelegram(settings.tgToken, settings.tgChatId, lines.join("\n"));
      setTgStatus("sent");
      setTimeout(() => setTgStatus("idle"), 3000);
    } catch (e) {
      setTgStatus("error"); setTgError(e.message || "Failed to send");
    }
  }, [tgConfigured, upcoming, priorityTarget, extraForDebt, settings.tgToken, settings.tgChatId]);

  const addIncome = () => setIncomes([...incomes, { id: uid(), name: "", amount: 0, frequency: "fortnightly" }]);
  const addExpense = () => setExpenses([...expenses, { id: uid(), name: "", amount: 0, frequency: "monthly" }]);
  const addDebt = () => setDebts([...debts, { id: uid(), name: "", balance: 0, apr: 0, minPayment: 0, dueDay: 1, goalDate: "", goalFreq: "fortnightly" }]);

  const upd = (setter, list, id, field, value) => setter(list.map(x => x.id === id ? { ...x, [field]: value } : x));
  const del = (setter, list, id) => setter(list.filter(x => x.id !== id));

  const yrs = Math.floor(payoff.months / 12), mos = payoff.months % 12;

  const cssVars = {
    "--bg": colors.bg, "--surface": colors.surface, "--border": colors.border,
    "--text": colors.text, "--muted": colors.muted, "--muted2": colors.muted2,
    "--accent": colors.accent, "--danger": colors.danger, "--warning": colors.warning,
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  };

  const SyncIcon = syncStatus === "syncing" ? RefreshCw : syncStatus === "synced" ? Cloud : syncStatus === "error" ? CloudOff : CloudOff;
  const syncColor = syncStatus === "synced" ? "var(--accent)" : syncStatus === "error" ? "var(--danger)" : "var(--muted2)";
  const syncLabel = syncStatus === "syncing" ? "syncing…" : syncStatus === "synced" ? "synced" : syncStatus === "error" ? "sync error" : "local only";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-200" style={cssVars}>
      <div className="max-w-md mx-auto px-4 pt-6 pb-28">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Ledger Line</div>
            <div className="flex items-center gap-2">
              <button
                title={syncLabel}
                onClick={supaConfigured ? openSettings : openSettings}
                className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-1 rounded-md"
                style={{ color: syncColor }}>
                <SyncIcon size={12} className={syncStatus === "syncing" ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => updateSettings({ themeMode: theme === "dark" ? "light" : "dark" })}
                className="text-[var(--muted)] hover:text-[var(--text)] p-1"
                title="Toggle theme">
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button onClick={openSettings} className="text-[var(--muted)] hover:text-[var(--text)] p-1" title="Settings">
                <Settings size={15} />
              </button>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[12px] text-[var(--muted)]">movable this month</div>
              <div className="text-4xl font-bold tracking-tight" style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", color: surplus >= 0 ? "var(--accent)" : "var(--danger)" }}>
                {fmtMoney(surplus)}
              </div>
            </div>
            {upcoming.length > 0 && (
              <div className="flex items-center gap-1 text-[var(--warning)] text-xs font-mono">
                <Bell size={14} />{upcoming.length}
              </div>
            )}
          </div>
        </div>

        {tab === "settings" ? (
          <SettingsPanel
            settings={settings}
            updateSettings={updateSettings}
            onBack={closeSettings}
            supaConfigured={supaConfigured}
            tgConfigured={tgConfigured}
            syncStatus={syncStatus}
            syncError={syncError}
            tgStatus={tgStatus}
            tgError={tgError}
            onSendTest={sendReminders}
            theme={theme}
          />
        ) : (
        <>
        {/* Tabs */}
        <div className="grid grid-cols-5 gap-1 mb-6 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)]">
          {[
            { id: "overview", icon: LayoutGrid, label: "Now" },
            { id: "money", icon: Wallet, label: "Money" },
            { id: "debts", icon: TrendingDown, label: "Debts" },
            { id: "goals", icon: Target, label: "Goals" },
            { id: "plan", icon: ListOrdered, label: "Plan" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] transition-colors ${tab === t.id ? "bg-[var(--bg)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Income / mo</div>
                <div className="font-mono text-lg text-[var(--accent)]">{fmtMoney(totalIncome)}</div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Expenses / mo</div>
                <div className="font-mono text-lg text-[var(--danger)]">{fmtMoney(totalExpenses)}</div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Min repayments</div>
                <div className="font-mono text-lg text-[var(--warning)]">{fmtMoney(totalMinPayments)}</div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Total debt</div>
                <div className="font-mono text-lg">{fmtMoney(totalDebtBalance)}</div>
              </div>
            </div>

            {priorityTarget && extraForDebt > 0 && (
              <div className="bg-[var(--surface)] border rounded-xl p-4" style={{ borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)" }}>
                <div className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-wider mb-2">
                  {strategy === "avalanche" ? <Flame size={13} /> : <Snowflake size={13} />} extra goes to
                </div>
                <div className="text-lg font-semibold">{priorityTarget.name || "Untitled debt"}</div>
                <div className="font-mono text-sm text-[var(--muted)] mt-1">
                  {fmtMoney(priorityTarget.minPayment)} min + <span className="text-[var(--accent)]">{fmtMoney(extraForDebt)} extra</span> this month
                </div>
              </div>
            )}

            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1"><Bell size={12}/> upcoming repayments</div>
              {upcoming.length === 0 && <div className="text-sm text-[var(--muted2)]">Nothing due in the next 14 days.</div>}
              <div className="space-y-2">
                {upcoming.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium">{d.name || "Untitled debt"}</div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">{fmtDate(d.dueDate)} · min {fmtMoney(d.minPayment)}</div>
                    </div>
                    <StatusPill days={d.days} />
                  </div>
                ))}
              </div>
              {tgConfigured && (
                <button
                  onClick={sendReminders}
                  disabled={tgStatus === "sending"}
                  className="w-full mt-3 flex items-center justify-center gap-2 text-xs font-medium py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-60"
                >
                  {tgStatus === "sending" ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  {tgStatus === "sent" ? "Sent to Telegram" : tgStatus === "error" ? "Failed — check settings" : "Send to Telegram"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* MONEY IN/OUT */}
        {tab === "money" && (
          <div className="space-y-6">
            <Section title="Income" onAdd={addIncome}>
              {incomes.map(i => (
                <RowCard key={i.id} onDelete={() => del(setIncomes, incomes, i.id)}>
                  <Field label="Source" placeholder="e.g. Part-time job" value={i.name} onChange={e => upd(setIncomes, incomes, i.id, "name", e.target.value)} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Field label="Amount" type="number" value={i.amount} onChange={e => upd(setIncomes, incomes, i.id, "amount", Number(e.target.value))} />
                    <Select label="Frequency" value={i.frequency} onChange={e => upd(setIncomes, incomes, i.id, "frequency", e.target.value)}>
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </div>
                </RowCard>
              ))}
            </Section>

            <Section title="Fixed expenses" onAdd={addExpense}>
              {expenses.map(e => (
                <RowCard key={e.id} onDelete={() => del(setExpenses, expenses, e.id)}>
                  <Field label="Expense" placeholder="e.g. Rent, groceries" value={e.name} onChange={ev => upd(setExpenses, expenses, e.id, "name", ev.target.value)} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Field label="Amount" type="number" value={e.amount} onChange={ev => upd(setExpenses, expenses, e.id, "amount", Number(ev.target.value))} />
                    <Select label="Frequency" value={e.frequency} onChange={ev => upd(setExpenses, expenses, e.id, "frequency", ev.target.value)}>
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </div>
                </RowCard>
              ))}
            </Section>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
              <Field label="Safety buffer / mo (kept aside, not sent to debts)" type="number" value={bufferAmt} onChange={e => setBufferAmt(Number(e.target.value))} />
            </div>
          </div>
        )}

        {/* DEBTS */}
        {tab === "debts" && (
          <div className="space-y-4">
            <Section title="Debts" onAdd={addDebt}>
              {debts.map(d => (
                <RowCard key={d.id} onDelete={() => del(setDebts, debts, d.id)}>
                  <Field label="Name" placeholder="e.g. Visa credit card" value={d.name} onChange={e => upd(setDebts, debts, d.id, "name", e.target.value)} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Field label="Balance owing" type="number" value={d.balance} onChange={e => upd(setDebts, debts, d.id, "balance", Number(e.target.value))} />
                    <Field label="Interest APR %" type="number" value={d.apr} onChange={e => upd(setDebts, debts, d.id, "apr", Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Field label="Min payment / mo" type="number" value={d.minPayment} onChange={e => upd(setDebts, debts, d.id, "minPayment", Number(e.target.value))} />
                    <Field label="Due day (1-28)" type="number" min="1" max="28" value={d.dueDay} onChange={e => upd(setDebts, debts, d.id, "dueDay", Math.min(28, Math.max(1, Number(e.target.value))))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--border)]">
                    <Field label="Payoff goal date" type="date" value={d.goalDate || ""} onChange={e => upd(setDebts, debts, d.id, "goalDate", e.target.value)} />
                    <Select label="Pay after each" value={d.goalFreq || "fortnightly"} onChange={e => upd(setDebts, debts, d.id, "goalFreq", e.target.value)}>
                      <option value="weekly">Weekly pay</option>
                      <option value="fortnightly">Fortnightly pay</option>
                      <option value="monthly">Monthly pay</option>
                    </Select>
                  </div>
                </RowCard>
              ))}
              {debts.length === 0 && <EmptyHint text="Add a debt to see it split into a repayment plan." />}
            </Section>
          </div>
        )}

        {/* GOALS */}
        {tab === "goals" && (
          <div className="space-y-5">
            <div className="text-[12px] text-[var(--muted)] px-1">
              Set a payoff date on any debt (in the Debts tab) and this works out what you need to pay after every pay cycle to hit it — interest included.
            </div>

            {goalDebts.length === 0 ? (
              <EmptyHint text="No payoff goals set yet. Open a debt in the Debts tab and add a payoff goal date." />
            ) : (
              <>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Required / mo, all goals</div>
                    <div className="font-mono text-lg">{fmtMoney(totalReqMonthly)}</div>
                  </div>
                  {totalShortfall > 0.5 ? (
                    <div className="text-right">
                      <div className="text-[11px] text-[var(--danger)] uppercase tracking-wider mb-1">short by</div>
                      <div className="font-mono text-lg text-[var(--danger)]">{fmtMoney(totalShortfall)}</div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--accent)] text-xs"><CheckCircle2 size={14}/> on track</span>
                  )}
                </div>

                <div className="space-y-3">
                  {goalDebts.map(d => {
                    const onTrack = d.shortfall <= 0.5;
                    const y = Math.floor(d.months / 12), m = Math.round(d.months % 12);
                    return (
                      <div key={d.id} className="bg-[var(--surface)] border rounded-xl p-3" style={{ borderColor: `color-mix(in srgb, ${onTrack ? "var(--accent)" : "var(--danger)"} 35%, transparent)` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{d.name || "Untitled debt"}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] font-mono">
                            <Calendar size={11} /> {fmtDate(d.goalDate)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Needed / {FREQ_LABEL[d.goalFreq]}</div>
                            <div className="font-mono text-base" style={{ color: onTrack ? "var(--accent)" : "var(--danger)" }}>{fmtMoney(d.reqPerPeriod)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Currently paying / mo</div>
                            <div className="font-mono text-base text-[var(--muted)]">{fmtMoney(d.minPayment)}</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted2)]">
                          {y > 0 ? `${y}y ` : ""}{m}mo to go · {onTrack ? "current payments will clear it in time" : `bump payments by ${fmtMoney(d.shortfall)}/mo to hit this date`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* PLAN */}
        {tab === "plan" && (
          <div className="space-y-5">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 flex gap-1">
              <button onClick={() => setStrategy("avalanche")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${strategy === "avalanche" ? "bg-[var(--bg)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                <Flame size={13} /> Avalanche
              </button>
              <button onClick={() => setStrategy("snowball")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${strategy === "snowball" ? "bg-[var(--bg)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                <Snowflake size={13} /> Snowball
              </button>
            </div>
            <div className="text-[12px] text-[var(--muted)] -mt-3 px-1">
              {strategy === "avalanche"
                ? "Extra cash attacks the highest interest rate first — least interest paid overall."
                : "Extra cash attacks the smallest balance first — quickest wins to build momentum."}
            </div>

            {debts.length === 0 ? (
              <EmptyHint text="Add debts and income/expenses to generate a plan." />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                    <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Debt-free in</div>
                    <div className="font-mono text-lg">{payoff.months >= 600 ? "600+ mo" : `${yrs}y ${mos}m`}</div>
                  </div>
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                    <div className="text-[11px] text-[var(--muted)] uppercase tracking-wider mb-1">Interest paid</div>
                    <div className="font-mono text-lg text-[var(--warning)]">{fmtMoney(payoff.totalInterest)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2">This month's split</div>
                  <div className="space-y-2">
                    {priorityOrder.map((d, idx) => {
                      const isTarget = idx === 0 && extraForDebt > 0;
                      const pay = Number(d.minPayment) + (isTarget ? extraForDebt : 0);
                      const pct = totalDebtBalance > 0 ? (d.balance / totalDebtBalance) * 100 : 0;
                      return (
                        <div key={d.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[var(--muted2)] w-4">{idx + 1}.</span>
                              <span className="text-sm font-medium">{d.name || "Untitled debt"}</span>
                            </div>
                            <span className="font-mono text-sm" style={{ color: isTarget ? "var(--accent)" : "var(--text)" }}>{fmtMoney(pay)}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isTarget ? "var(--accent)" : "var(--border)" }} />
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-[var(--muted2)] font-mono">
                            <span>{fmtMoney(d.balance)} owing · {d.apr}% APR</span>
                            {isTarget && <span className="text-[var(--accent)]">priority target</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({ settings, updateSettings, onBack, supaConfigured, tgConfigured, syncStatus, syncError, tgStatus, tgError, onSendTest, theme }) {
  const [local, setLocal] = useState(settings);
  useEffect(() => { setLocal(settings); }, [settings]);
  const set = (k, v) => setLocal(l => ({ ...l, [k]: v }));
  const dirty = JSON.stringify(local) !== JSON.stringify(settings);

  return (
    <div className="space-y-6 pb-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)] -ml-1">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Appearance */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2">Appearance</div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 flex gap-1">
          {[
            { id: "system", label: "System" },
            { id: "dark", label: "Dark" },
            { id: "light", label: "Light" },
          ].map(o => (
            <button key={o.id} onClick={() => updateSettings({ themeMode: o.id })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${settings.themeMode === o.id ? "bg-[var(--bg)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Supabase */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Supabase sync</div>
          <span className="text-[10px] font-mono" style={{ color: syncStatus === "synced" ? "var(--accent)" : syncStatus === "error" ? "var(--danger)" : "var(--muted2)" }}>
            {syncStatus === "syncing" ? "syncing…" : syncStatus === "synced" ? "synced" : syncStatus === "error" ? "error" : "local only"}
          </span>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 space-y-2">
          <Field label="Project URL" placeholder="https://xxxx.supabase.co" value={local.supaUrl} onChange={e => set("supaUrl", e.target.value)} />
          <Field label="Anon (public) API key" placeholder="eyJhbGciOi..." value={local.supaKey} onChange={e => set("supaKey", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Table name" value={local.supaTable} onChange={e => set("supaTable", e.target.value)} />
            <Field label="Row ID" value={local.supaRowId} onChange={e => set("supaRowId", e.target.value)} />
          </div>
          {syncStatus === "error" && syncError && <div className="text-[11px] text-[var(--danger)]">{syncError}</div>}
          <details className="text-[11px] text-[var(--muted)]">
            <summary className="cursor-pointer select-none">Table doesn't exist yet? Run this SQL once in Supabase</summary>
            <pre className="mt-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 overflow-x-auto text-[10px] leading-relaxed">{`create table if not exists ${local.supaTable || "finance_state"} (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table ${local.supaTable || "finance_state"} enable row level security;
create policy "anon read/write own row"
  on ${local.supaTable || "finance_state"} for all
  using (true) with check (true);`}</pre>
            <div className="mt-1">This uses the anon key with an open policy — fine for a single-user personal tracker, not for shared/public deployments.</div>
          </details>
        </div>
      </div>

      {/* Telegram */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2">Telegram reminders</div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 space-y-2">
          <Field label="Bot token" placeholder="123456:ABC-DEF..." value={local.tgToken} onChange={e => set("tgToken", e.target.value)} />
          <Field label="Chat ID" placeholder="e.g. 987654321" value={local.tgChatId} onChange={e => set("tgChatId", e.target.value)} />
          {tgStatus === "error" && tgError && <div className="text-[11px] text-[var(--danger)]">{tgError}</div>}
          <details className="text-[11px] text-[var(--muted)]">
            <summary className="cursor-pointer select-none">How to get these</summary>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Message <span className="font-mono">@BotFather</span> on Telegram, send <span className="font-mono">/newbot</span>, copy the token it gives you.</li>
              <li>Message your new bot anything once (so it can message you back).</li>
              <li>Open <span className="font-mono">https://api.telegram.org/bot&lt;token&gt;/getUpdates</span> in a browser and copy the <span className="font-mono">chat.id</span> number.</li>
            </ol>
          </details>
          <button
            onClick={onSendTest}
            disabled={!local.tgToken || !local.tgChatId || tgStatus === "sending" || dirty}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50">
            {tgStatus === "sending" ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
            {tgStatus === "sent" ? "Sent — check Telegram" : "Send test reminder"}
          </button>
          {dirty && <div className="text-[10px] text-[var(--muted2)] text-center">Save your changes below before testing.</div>}
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-[11px] text-[var(--muted)] leading-relaxed">
        Heads up: this runs in your browser, so it can only sync or message Telegram while the app is open. For reminders to fire on their own each day, the due-date check needs to run server-side — a small Supabase Edge Function on a schedule works well. Ask and I can put that together separately.
      </div>

      <button
        onClick={() => updateSettings(local)}
        disabled={!dirty}
        className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
        style={{ backgroundColor: "var(--accent)", color: theme === "dark" ? "#0B0F13" : "#FFFFFF" }}>
        {dirty ? "Save settings" : "Saved"}
      </button>
    </div>
  );
}

function Section({ title, onAdd, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{title}</div>
        <button onClick={onAdd} className="flex items-center gap-1 text-[11px] text-[var(--accent)] font-medium">
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function RowCard({ children, onDelete }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 relative">
      <button onClick={onDelete} className="absolute top-2.5 right-2.5 text-[var(--muted2)] hover:text-[var(--danger)]">
        <Trash2 size={14} />
      </button>
      <div className="pr-6">{children}</div>
    </div>
  );
}

function EmptyHint({ text }) {
  return (
    <div className="border border-dashed border-[var(--border)] rounded-xl p-6 text-center text-sm text-[var(--muted2)]">
      {text}
    </div>
  );
}
