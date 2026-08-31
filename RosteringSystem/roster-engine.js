"use strict";

// Client-side auto-generate: reads open shift slots + employee availability
// for a date range, greedily assigns employees whose availability fully
// covers a slot, favouring whoever has the fewest hours assigned so far
// (for rough fairness), and skips anyone who'd end up double-booked.
//
// Runs as the logged-in admin, so it's bound by the same RLS policies as
// any other write the admin makes — nothing here bypasses security.

const RosterEngine = {
  async generate(companyId, startDateISO, endDateISO){
    const summary = { seatsFilled: 0, seatsUnfilled: 0, slotsTouched: 0 };

    // 1. Open slots in range
    const { data: slots, error: slotsErr } = await supabaseClient
      .from("shift_slots")
      .select("*")
      .eq("company_id", companyId)
      .gte("date", startDateISO)
      .lte("date", endDateISO)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if(slotsErr) throw slotsErr;
    if(!slots || slots.length === 0) return summary;

    // 2. Existing assignments for those slots (to know how full each slot already is,
    //    and to build each employee's current per-day commitments + running hours)
    const slotIds = slots.map(s => s.id);
    const { data: existingAssignments, error: assignErr } = await supabaseClient
      .from("shift_assignments")
      .select("id, slot_id, employee_id")
      .in("slot_id", slotIds);
    if(assignErr) throw assignErr;

    const slotById = {};
    slots.forEach(s => { slotById[s.id] = s; });

    // filled count per slot
    const filledCount = {};
    slots.forEach(s => { filledCount[s.id] = 0; });
    (existingAssignments || []).forEach(a => {
      filledCount[a.slot_id] = (filledCount[a.slot_id] || 0) + 1;
    });

    // 3. All employees in the company + their availability
    const { data: employees, error: empErr } = await supabaseClient
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId)
      .eq("role", "employee");
    if(empErr) throw empErr;
    if(!employees || employees.length === 0) return summary;

    const employeeIds = employees.map(e => e.id);
    const { data: availRows, error: availErr } = await supabaseClient
      .from("availability")
      .select("employee_id, day_of_week, start_time, end_time")
      .in("employee_id", employeeIds);
    if(availErr) throw availErr;

    const availByEmployee = {};
    employeeIds.forEach(id => { availByEmployee[id] = []; });
    (availRows || []).forEach(a => { availByEmployee[a.employee_id].push(a); });

    // 3b. Each employee's role(s), so slots that require a specific role only
    //     match employees who hold it. A slot with no role_id fits anyone.
    const { data: roleRows, error: roleErr } = await supabaseClient
      .from("employee_roles")
      .select("employee_id, role_id")
      .in("employee_id", employeeIds);
    if(roleErr) throw roleErr;
    const rolesByEmployee = {};
    employeeIds.forEach(id => { rolesByEmployee[id] = new Set(); });
    (roleRows || []).forEach(r => { rolesByEmployee[r.employee_id].add(r.role_id); });

    // 4. All assignments across the WHOLE company in range (not just the slots
    //    we're filling) so we correctly avoid double-booking on days that
    //    already have unrelated shifts assigned.
    const { data: allSlotsInRange } = await supabaseClient
      .from("shift_slots")
      .select("id, date, start_time, end_time")
      .eq("company_id", companyId)
      .gte("date", startDateISO)
      .lte("date", endDateISO);
    const rangeSlotById = {};
    (allSlotsInRange || []).forEach(s => { rangeSlotById[s.id] = s; });

    const { data: allAssignInRange } = await supabaseClient
      .from("shift_assignments")
      .select("slot_id, employee_id")
      .in("slot_id", (allSlotsInRange || []).map(s => s.id));

    // employeeId -> array of {date, start, end}
    const employeeBookings = {};
    employeeIds.forEach(id => { employeeBookings[id] = []; });
    (allAssignInRange || []).forEach(a => {
      const s = rangeSlotById[a.slot_id];
      if(!s) return;
      if(!employeeBookings[a.employee_id]) employeeBookings[a.employee_id] = [];
      employeeBookings[a.employee_id].push({ date: s.date, start: s.start_time, end: s.end_time });
    });

    // running assigned hours per employee, for fairness ordering
    const assignedHours = {};
    employeeIds.forEach(id => {
      let total = 0;
      (employeeBookings[id] || []).forEach(b => {
        total += (timeToMinutes(b.end) - timeToMinutes(b.start)) / 60;
      });
      assignedHours[id] = total;
    });

    function overlaps(dateA, startA, endA, dateB, startB, endB){
      if(dateA !== dateB) return false;
      return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
    }

    function availabilityCovers(avail, dayOfWeek, start, end){
      return avail.some(a =>
        a.day_of_week === dayOfWeek &&
        timeToMinutes(a.start_time) <= timeToMinutes(start) &&
        timeToMinutes(a.end_time) >= timeToMinutes(end)
      );
    }

    const toInsert = [];

    for(const slot of slots){
      const openSeats = slot.headcount - (filledCount[slot.id] || 0);
      if(openSeats <= 0) continue;
      summary.slotsTouched++;

      const slotDate = parseDateISO(slot.date);
      const dayOfWeek = slotDate.getDay();

      // already-assigned employee ids for THIS slot (don't double-assign the same person)
      const alreadyOnSlot = new Set(
        (existingAssignments || []).filter(a => a.slot_id === slot.id).map(a => a.employee_id)
      );

      let candidates = employeeIds.filter(id => {
        if(alreadyOnSlot.has(id)) return false;
        if(slot.role_id && !rolesByEmployee[id].has(slot.role_id)) return false;
        if(!availabilityCovers(availByEmployee[id] || [], dayOfWeek, slot.start_time, slot.end_time)) return false;
        const bookings = employeeBookings[id] || [];
        const clashes = bookings.some(b => overlaps(slot.date, slot.start_time, slot.end_time, b.date, b.start, b.end));
        return !clashes;
      });

      candidates.sort((a, b) => assignedHours[a] - assignedHours[b]);

      const picked = candidates.slice(0, openSeats);
      picked.forEach(employeeId => {
        toInsert.push({ slot_id: slot.id, employee_id: employeeId, assigned_by: "auto" });
        // update local state so later slots in this same run see the new load/booking
        const hours = (timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time)) / 60;
        assignedHours[employeeId] += hours;
        employeeBookings[employeeId].push({ date: slot.date, start: slot.start_time, end: slot.end_time });
        summary.seatsFilled++;
      });
      summary.seatsUnfilled += (openSeats - picked.length);
    }

    if(toInsert.length > 0){
      const { error: insertErr } = await supabaseClient.from("shift_assignments").insert(toInsert);
      if(insertErr) throw insertErr;
    }

    return summary;
  }
};
