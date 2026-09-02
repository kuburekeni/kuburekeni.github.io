"use strict";

// ---------------------------------------------------------------------------
// PayrollEngine — turns rostered shifts into categorised, costed hours.
//
// The rules it applies, in order:
//
// 1. A shift is split at midnight. The portion before midnight is charged at
//    its own date's day type, the portion after at the next date's. This
//    matters because a Saturday-night shift that runs to 2am is partly Sunday.
//
// 2. Day type is resolved most-specific-first:
//    public holiday > Sunday > Saturday > weekday.
//
// 3. Overtime is worked out per employee, per week, processing shifts in
//    chronological order. Hours are overtime if they push that day past the
//    daily threshold OR that week past the weekly threshold — whichever
//    triggers first. Overtime replaces the day-type multiplier rather than
//    stacking on top of it (stacking would double-count penalty rates).
//
// 4. If a second overtime tier is configured, hours past that many overtime
//    hours in the week move to the higher multiplier.
// ---------------------------------------------------------------------------

const PayrollEngine = {

  // Splits a ROSTERED shift (HH:MM strings) into [{ date, hours }] at midnight.
  // Because a rostered shift only has minute precision, end <= start is taken
  // to mean it runs past midnight.
  splitAtMidnight(dateISO, startTime, endTime){
    const startMin = timeToMinutes(startTime);
    let endMin = timeToMinutes(endTime);
    if(endMin <= startMin) endMin += 24 * 60;

    const segments = [];
    const firstDayMinutes = Math.min(endMin, 24 * 60) - startMin;
    if(firstDayMinutes > 0){
      segments.push({ date: dateISO, hours: firstDayMinutes / 60 });
    }
    if(endMin > 24 * 60){
      segments.push({ date: addDaysISO(dateISO, 1), hours: (endMin - 24 * 60) / 60 });
    }
    return segments;
  },

  // Splits an ACTUAL clocked period (real timestamps) at midnight.
  // Unlike the rostered path there is no overnight guesswork: the timestamps
  // say exactly how long it was, so a 2-second punch stays 2 seconds instead
  // of being mistaken for a 24-hour shift.
  splitTimestampsAtMidnight(startTs, endTs){
    const start = new Date(startTs);
    const end = new Date(endTs);
    const segments = [];
    if(!(end > start)) return segments;   // zero or negative: contributes nothing

    let cursor = new Date(start);
    while(cursor < end){
      const midnight = new Date(cursor);
      midnight.setHours(24, 0, 0, 0);            // next midnight after cursor
      const segEnd = midnight < end ? midnight : end;
      const iso = cursor.getFullYear()+"-"+pad2(cursor.getMonth()+1)+"-"+pad2(cursor.getDate());
      segments.push({ date: iso, hours: (segEnd - cursor)/3600000 });
      cursor = segEnd;
    }
    return segments;
  },

  // public holiday > sunday > saturday > weekday
  dayTypeFor(dateISO, holidaySet){
    if(holidaySet && holidaySet.has(dateISO)) return "public_holiday";
    const dow = parseDateISO(dateISO).getDay(); // 0 Sun .. 6 Sat
    if(dow === 0) return "sunday";
    if(dow === 6) return "saturday";
    return "weekday";
  },

  // assignments: [{ employee_id, date, start_time, end_time }]
  // Returns { byEmployee: { id: { categories:{}, overtime:{}, totalHours, totalPay } }, categoryNames }
  calculate(assignments, opts){
    const rulesByDayType = opts.rulesByDayType || {};
    const holidaySet = opts.holidaySet || new Set();
    const settings = opts.settings || {};
    const ratesByEmployee = opts.ratesByEmployee || {};

    const weeklyThreshold = Number(settings.weekly_overtime_hours) || Infinity;
    const dailyThreshold  = Number(settings.daily_overtime_hours) || Infinity;
    const otMultiplier    = Number(settings.overtime_multiplier) || 1.5;
    const otStepHours     = settings.overtime_step_hours == null ? null : Number(settings.overtime_step_hours);
    const otStepMultiplier= settings.overtime_step_multiplier == null ? null : Number(settings.overtime_step_multiplier);

    // 1. Expand every assignment into midnight-split segments.
    const segmentsByEmployee = {};
    assignments.forEach(a => {
      let segs, firstTime, anchorDate;
      if(a.start_ts && a.end_ts){
        // Actual clocked time — exact, no overnight inference.
        segs = this.splitTimestampsAtMidnight(a.start_ts, a.end_ts);
        const d = new Date(a.start_ts);
        firstTime = pad2(d.getHours())+":"+pad2(d.getMinutes());
        anchorDate = d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
      } else {
        segs = this.splitAtMidnight(a.date, a.start_time, a.end_time);
        firstTime = a.start_time;
        anchorDate = a.date;
      }
      if(!segmentsByEmployee[a.employee_id]) segmentsByEmployee[a.employee_id] = [];
      segs.forEach(s => {
        segmentsByEmployee[a.employee_id].push({
          date: s.date,
          hours: s.hours,
          // sort key keeps chronological order so overtime accrues correctly
          sortKey: s.date + " " + (s.date === anchorDate ? firstTime : "00:00")
        });
      });
    });

    const byEmployee = {};

    Object.keys(segmentsByEmployee).forEach(empId => {
      const segments = segmentsByEmployee[empId].sort((x, y) => x.sortKey < y.sortKey ? -1 : 1);
      const rate = ratesByEmployee[empId];

      const categories = {};   // dayType -> { hours, pay }
      const overtime = { tier1: { hours: 0, pay: 0 }, tier2: { hours: 0, pay: 0 } };
      let weeklyOrdinary = 0;      // ordinary hours accrued so far this week
      let overtimeAccrued = 0;     // overtime hours accrued so far this week
      const dailyOrdinary = {};    // date -> ordinary hours already on that date

      segments.forEach(seg => {
        let remaining = seg.hours;
        const dayType = this.dayTypeFor(seg.date, holidaySet);
        if(dailyOrdinary[seg.date] == null) dailyOrdinary[seg.date] = 0;

        while(remaining > 0.00001){
          // How many more ordinary hours are allowed before either threshold bites?
          const dailyRoom  = Math.max(0, dailyThreshold - dailyOrdinary[seg.date]);
          const weeklyRoom = Math.max(0, weeklyThreshold - weeklyOrdinary);
          const ordinaryRoom = Math.min(dailyRoom, weeklyRoom);

          if(ordinaryRoom > 0.00001){
            const take = Math.min(remaining, ordinaryRoom);
            const rule = rulesByDayType[dayType];
            const mult = rule ? Number(rule.multiplier) : 1;
            if(!categories[dayType]) categories[dayType] = { hours: 0, pay: 0 };
            categories[dayType].hours += take;
            if(rate != null) categories[dayType].pay += take * rate * mult;
            dailyOrdinary[seg.date] += take;
            weeklyOrdinary += take;
            remaining -= take;
          } else {
            // Everything left on this segment is overtime.
            let otTake = remaining;
            // Split across the two overtime tiers if a step is configured.
            if(otStepHours != null && otStepMultiplier != null){
              const tier1Room = Math.max(0, otStepHours - overtimeAccrued);
              const inTier1 = Math.min(otTake, tier1Room);
              if(inTier1 > 0){
                overtime.tier1.hours += inTier1;
                if(rate != null) overtime.tier1.pay += inTier1 * rate * otMultiplier;
                overtimeAccrued += inTier1;
                otTake -= inTier1;
              }
              if(otTake > 0.00001){
                overtime.tier2.hours += otTake;
                if(rate != null) overtime.tier2.pay += otTake * rate * otStepMultiplier;
                overtimeAccrued += otTake;
              }
            } else {
              overtime.tier1.hours += otTake;
              if(rate != null) overtime.tier1.pay += otTake * rate * otMultiplier;
              overtimeAccrued += otTake;
            }
            remaining = 0;
          }
        }
      });

      let totalHours = 0, totalPay = 0;
      Object.keys(categories).forEach(k => { totalHours += categories[k].hours; totalPay += categories[k].pay; });
      totalHours += overtime.tier1.hours + overtime.tier2.hours;
      totalPay   += overtime.tier1.pay + overtime.tier2.pay;

      byEmployee[empId] = {
        categories: categories,
        overtime: overtime,
        totalHours: totalHours,
        totalPay: rate != null ? totalPay : null,
        hasRate: rate != null
      };
    });

    return byEmployee;
  }
};
