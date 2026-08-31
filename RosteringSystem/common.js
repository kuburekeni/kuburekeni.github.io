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
function avatarHtml(name, sizeClass){
  const c = avatarColor(name);
  const cls = "avatar" + (sizeClass ? " " + sizeClass : "");
  return '<div class="'+cls+'" style="background:'+c.bg+';color:'+c.fg+';">'+escapeHtml(getInitials(name))+'</div>';
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

// ---------- auth guard ----------
// Returns { session, profile } once resolved, or redirects to index.html.
async function requireSession(requiredRole){
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
