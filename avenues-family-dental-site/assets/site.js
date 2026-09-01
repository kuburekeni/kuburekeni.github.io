/* The Avenues Family Dental — shared behaviour
   Opening hours confirmed from the practice contact page:
   Mon 8am-6pm, Tue-Thu 8am-9pm, Fri 8am-6pm, Sat 8am-2pm, Sun closed.
   If hours change, update HOURS below AND the JSON-LD block in index.html. */

var HOURS = [
  { day:"Sunday",    open:null,    close:null    },
  { day:"Monday",    open:"08:00", close:"18:00" },
  { day:"Tuesday",   open:"08:00", close:"21:00" },
  { day:"Wednesday", open:"08:00", close:"21:00" },
  { day:"Thursday",  open:"08:00", close:"21:00" },
  { day:"Friday",    open:"08:00", close:"18:00" },
  { day:"Saturday",  open:"08:00", close:"14:00" }
];

function fmtTime(t){
  if(!t) return "Closed";
  var p = t.split(":"), h = +p[0], m = p[1];
  var ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m === "00" ? h + ap : h + "." + m + ap;
}
function toMins(t){ var p = t.split(":"); return (+p[0]) * 60 + (+p[1]); }

/* Evaluate against Brisbane time regardless of the visitor's own timezone. */
function brisbaneNow(){
  return new Date(new Date().toLocaleString("en-US", { timeZone:"Australia/Brisbane" }));
}

function renderHours(){
  var now = brisbaneNow();
  var idx = now.getDay();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var today = HOURS[idx];
  var isOpen = !!today.open && nowMin >= toMins(today.open) && nowMin < toMins(today.close);

  var dot = document.getElementById("dot");
  var label = document.getElementById("statusLabel");
  var sub = document.getElementById("statusSub");

  if(dot && label && sub){
    if(isOpen){
      dot.classList.add("open");
      label.textContent = "Open now";
      sub.textContent = "Closes " + fmtTime(today.close);
    } else {
      dot.classList.remove("open");
      label.textContent = "Closed right now";
      var next = null;
      for(var i = 0; i < 7; i++){
        var d = HOURS[(idx + i) % 7];
        if(d.open && !(i === 0 && nowMin >= toMins(d.open))){ next = { d:d, i:i }; break; }
      }
      sub.textContent = next
        ? "Opens " + (next.i === 0 ? "" : next.i === 1 ? "tomorrow " : next.d.day + " ") + fmtTime(next.d.open)
        : "Book an appointment any time";
    }
  }

  var list = document.getElementById("hoursList");
  if(list){
    var rows = "";
    for(var j = 0; j < 7; j++){
      var h = HOURS[(idx + j) % 7];
      var time = h.open ? fmtTime(h.open) + " \u2013 " + fmtTime(h.close) : "Closed";
      rows += '<li class="' + (j === 0 ? "today" : "") + '"><span class="day">' +
              (j === 0 ? "Today" : h.day) + '</span><span class="time">' + time + '</span></li>';
    }
    list.innerHTML = rows;
  }

  var plain = document.getElementById("visitHours");
  if(plain){
    var out = "";
    for(var n = 1; n <= 7; n++){
      var hh = HOURS[n % 7];
      out += hh.day + ": " + (hh.open ? fmtTime(hh.open) + " \u2013 " + fmtTime(hh.close) : "Closed") + "<br>";
    }
    plain.innerHTML = out;
  }
}

renderHours();
setInterval(renderHours, 60000);

var yr = document.getElementById("yr");
if(yr) yr.textContent = new Date().getFullYear();

var toggle = document.querySelector(".nav-toggle");
var nav = document.getElementById("mainnav");
if(toggle && nav){
  toggle.addEventListener("click", function(){
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function(e){
    if(e.target.tagName === "A"){
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}
