"use strict";

// ---------- date / format helpers ----------
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad2(n){ return n < 10 ? "0"+n : ""+n; }

function todayISO(){
  const d = new Date();
  return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
}
function parseDateISO(iso){
  const p = iso.split("-");
  return new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10));
}
function addDaysISO(iso, days){
  const d = parseDateISO(iso);
  d.setDate(d.getDate()+days);
  return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
}
function fmtDateShort(iso){
  const d = parseDateISO(iso);
  return DAY_SHORT[d.getDay()]+" "+d.getDate()+" "+MONTH_NAMES[d.getMonth()];
}
// "HH:MM" -> minutes since midnight, for range comparisons
function timeToMinutes(hhmm){
  const p = hhmm.split(":");
  return parseInt(p[0],10)*60 + parseInt(p[1],10);
}
function fmtHours(h){
  if(h <= 0) return "0h";
  let hrs = Math.floor(h);
  let mins = Math.round((h - hrs) * 60);
  if(mins === 60){ hrs += 1; mins = 0; }
  if(hrs === 0) return mins+"m";
  if(mins === 0) return hrs+"h";
  return hrs+"h "+mins+"m";
}
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

// ---------- avatars ----------
const AVATAR_PALETTE = [
  { bg:"#EBF0FE", fg:"#2E5AF5" },
  { bg:"#E6F9EF", fg:"#0C8A50" },
  { bg:"#FFF4E5", fg:"#B75E09" },
  { bg:"#FEEEEC", fg:"#D92D20" },
  { bg:"#F0EBFE", fg:"#6941C6" },
  { bg:"#E8F6FB", fg:"#0E7C93" },
  { bg:"#FDE8EF", fg:"#C0175C" }
];
function hashStr(str){
  let h = 0;
  for(let i = 0; i < str.length; i++){ h = (h * 31 + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}
function getInitials(name){
  if(!name) return "?";
  const parts = name.trim().split(/\s+/);
  let initials = parts[0][0] || "";
  if(parts.length > 1) initials += parts[parts.length - 1][0];
  return initials.toUpperCase();
}
function avatarColor(name){
  return AVATAR_PALETTE[hashStr(name || "?") % AVATAR_PALETTE.length];
}
// Renders a photo if the person has one, otherwise coloured initials.
function avatarHtml(name, sizeClass, avatarUrl){
  const cls = "avatar" + (sizeClass ? " " + sizeClass : "");
  if(avatarUrl){
    return '<div class="'+cls+'" style="background-image:url('+JSON.stringify(avatarUrl)+');background-size:cover;background-position:center;"></div>';
  }
  const c = avatarColor(name);
  return '<div class="'+cls+'" style="background:'+c.bg+';color:'+c.fg+';">'+escapeHtml(getInitials(name))+'</div>';
}

// ---------- hours ----------
// Duration of a shift in decimal hours, handling shifts that run past midnight.
function shiftHours(startTime, endTime){
  let mins = timeToMinutes(endTime) - timeToMinutes(startTime);
  if(mins <= 0) mins += 24 * 60; // overnight shift
  return mins / 60;
}

// Monday-start week containing the given ISO date, as { start, end } ISO strings.
function weekRangeFor(iso){
  const d = parseDateISO(iso);
  const day = d.getDay();               // 0 = Sun
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => x.getFullYear()+"-"+pad2(x.getMonth()+1)+"-"+pad2(x.getDate());
  return { start: fmt(monday), end: fmt(sunday) };
}

// ---------- toast ----------
function showToast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>{ t.classList.remove("show"); }, 2200);
}

// ---------- setup guard ----------
// If supabase-config.js or the Supabase CDN script didn't load (usually a
// missing/misplaced file on the host), fail with a clear on-page message
// instead of a cryptic console-only crash.
function ensureSupabaseReady(){
  if(typeof window.supabase === "undefined" || typeof supabaseClient === "undefined"){
    document.body.innerHTML =
      '<div style="max-width:480px;margin:80px auto;padding:24px 28px;font-family:system-ui,-apple-system,sans-serif;text-align:center;color:#101323;">'+
      '<h2 style="margin:0 0 10px;">Setup incomplete</h2>'+
      '<p style="color:#5B6472;line-height:1.6;margin:0;">This page could not load the Supabase library or <code>supabase-config.js</code>. '+
      'Check that every file &mdash; <code>app.css</code>, <code>common.js</code>, <code>supabase-config.js</code>, <code>roster-engine.js</code>, and the HTML pages &mdash; '+
      'is uploaded to the exact same folder, and open DevTools &rarr; Network to see which request 404\u2019d.</p>'+
      '</div>';
    return false;
  }
  return true;
}

// ---------- auth guard ----------
// Returns { session, profile } once resolved, or redirects to index.html.
async function requireSession(requiredRole){
  if(!ensureSupabaseReady()) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if(!session){
    window.location.href = "index.html";
    return null;
  }
  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if(error || !profile){
    // Signed in but hasn't finished onboarding (no company yet)
    window.location.href = "index.html";
    return null;
  }
  if(requiredRole && profile.role !== requiredRole){
    window.location.href = profile.role === "admin" ? "admin.html" : "employee.html";
    return null;
  }
  return { session, profile };
}

async function signOut(){
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// ---------- calendar helpers ----------
// Returns 42 cells (6 weeks, Sunday-start) covering the given month, each
// { iso, day, inMonth, isToday } — enough to render a standard month grid.
function buildMonthGrid(year, monthIndex){
  var firstOfMonth = new Date(year, monthIndex, 1);
  var startWeekday = firstOfMonth.getDay();
  var gridStart = new Date(year, monthIndex, 1 - startWeekday);
  var today = todayISO();
  var cells = [];
  for(var i = 0; i < 42; i++){
    var d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    var iso = d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
    cells.push({ iso: iso, day: d.getDate(), inMonth: d.getMonth() === monthIndex, isToday: iso === today });
  }
  return cells;
}

// ---------- relative time ----------
function timeAgo(iso){
  var then = new Date(iso).getTime();
  var diffSec = Math.floor((Date.now() - then) / 1000);
  if(diffSec < 60) return "just now";
  var diffMin = Math.floor(diffSec / 60);
  if(diffMin < 60) return diffMin + "m ago";
  var diffHr = Math.floor(diffMin / 60);
  if(diffHr < 24) return diffHr + "h ago";
  var diffDay = Math.floor(diffHr / 24);
  if(diffDay < 7) return diffDay + "d ago";
  var d = new Date(then);
  return MONTH_NAMES[d.getMonth()] + " " + d.getDate();
}
