// Helper to compute specific weekday in a month
function nthWeekdayOfMonth(year: number, monthIndex0: number, weekday: number, n: number): Date {
  const first = new Date(Date.UTC(year, monthIndex0, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (7 + weekday - firstWeekday) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(Date.UTC(year, monthIndex0, day));
}

function lastWeekdayOfMonth(year: number, monthIndex0: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, monthIndex0 + 1, 0));
  const lastWeekday = last.getUTCDay();
  const offset = (7 + lastWeekday - weekday) % 7;
  const day = last.getUTCDate() - offset;
  return new Date(Date.UTC(year, monthIndex0, day));
}

function firstWeekdayOfMonth(year: number, monthIndex0: number, weekday: number): Date {
  return nthWeekdayOfMonth(year, monthIndex0, weekday, 1);
}

// Known municipal election cycle rules (estimated, subject to change by province)
// Returns a Date in UTC
export function nextMunicipalElectionDate(province: string, fromDate = new Date()): { date: Date; estimated: boolean; rule: string } {
  const p = province.trim().toLowerCase();
  const y = fromDate.getUTCFullYear();
  // For each province, determine base year and rule
  // AB: every 4 years, 3rd Monday in October. Last: 2021-10-18
  if (p.includes('alberta')) {
    const base = 2021;
    const targetYear = y <= 2025 ? 2025 : base + 4 * Math.ceil((y - base) / 4);
    const d = nthWeekdayOfMonth(targetYear, 9, 1, 3); // Oct (9), Monday(1), 3rd
    return { date: d, estimated: true, rule: 'Every 4 years, third Monday in October' };
  }
  // ON: every 4 years, 4th Monday in October. Last: 2022-10-24
  if (p.includes('ontario')) {
    const base = 2022;
    const targetYear = y <= 2026 ? 2026 : base + 4 * Math.ceil((y - base) / 4);
    const d = nthWeekdayOfMonth(targetYear, 9, 1, 4);
    return { date: d, estimated: true, rule: 'Every 4 years, fourth Monday in October' };
  }
  // BC: every 4 years, 3rd Saturday in October. Last: 2022-10-15
  if (p.includes('british columbia') || p.includes('bc')) {
    const base = 2022;
    const targetYear = y <= 2026 ? 2026 : base + 4 * Math.ceil((y - base) / 4);
    const d = nthWeekdayOfMonth(targetYear, 9, 6, 3); // Saturday(6)
    return { date: d, estimated: true, rule: 'Every 4 years, third Saturday in October' };
  }
  // QC: every 4 years, 1st Sunday in November. Last: 2021-11-07
  if (p.includes('quebec') || p.includes('québec')) {
    const base = 2021;
    const targetYear = y <= 2025 ? 2025 : base + 4 * Math.ceil((y - base) / 4);
    const d = firstWeekdayOfMonth(targetYear, 10, 0); // Nov(10), Sunday(0)
    return { date: d, estimated: true, rule: 'Every 4 years, first Sunday in November' };
  }
  // MB: every 4 years, last Wednesday in October. Last: 2022-10-26
  if (p.includes('manitoba')) {
    const base = 2022;
    const targetYear = y <= 2026 ? 2026 : base + 4 * Math.ceil((y - base) / 4);
    const d = lastWeekdayOfMonth(targetYear, 9, 3); // Wednesday(3)
    return { date: d, estimated: true, rule: 'Every 4 years, last Wednesday in October' };
  }
  // SK: approx every 4 years, second Wednesday in November (cities/towns). Last: 2024-11-13
  if (p.includes('saskatchewan')) {
    const base = 2024;
    const targetYear = y <= 2028 ? 2028 : base + 4 * Math.ceil((y - base) / 4);
    const d = nthWeekdayOfMonth(targetYear, 10, 3, 2); // Nov, Wednesday, 2nd
    return { date: d, estimated: true, rule: 'Every 4 years, second Wednesday in November' };
  }
  // NB: approx every 4 years, May (varies). Use first Monday in May
  if (p.includes('new brunswick')) {
    const base = 2020;
    const targetYear = y <= 2024 ? 2024 : base + 4 * Math.ceil((y - base) / 4);
    const d = firstWeekdayOfMonth(targetYear, 4, 1); // May, Monday
    return { date: d, estimated: true, rule: 'Approx. every 4 years, first Monday in May' };
  }
  // NS: approx every 4 years, third Saturday of October. Last: 2020-10-17, next ~2024-10-19
  if (p.includes('nova scotia')) {
    const base = 2020;
    const targetYear = y <= 2024 ? 2024 : base + 4 * Math.ceil((y - base) / 4);
    const d = nthWeekdayOfMonth(targetYear, 9, 6, 3); // Oct, Saturday, 3rd
    return { date: d, estimated: true, rule: 'Approx. every 4 years, third Saturday in October' };
  }
  // NL: approx every 4 years, Sept (varies). Use last Tuesday in September
  if (p.includes('newfoundland')) {
    const base = 2021;
    const targetYear = y <= 2025 ? 2025 : base + 4 * Math.ceil((y - base) / 4);
    const d = lastWeekdayOfMonth(targetYear, 8, 2); // Sept, Tuesday
    return { date: d, estimated: true, rule: 'Approx. every 4 years, last Tuesday in September' };
  }
  // PEI: approx every 4 years, Nov. Use first Monday in November
  if (p.includes('prince edward') || p.includes('pei')) {
    const base = 2022;
    const targetYear = y <= 2026 ? 2026 : base + 4 * Math.ceil((y - base) / 4);
    const d = firstWeekdayOfMonth(targetYear, 10, 1); // Nov, Monday
    return { date: d, estimated: true, rule: 'Approx. every 4 years, first Monday in November' };
  }
  // Territories: default estimate every 4 years, third Monday in October
  if (p.includes('yukon') || p.includes('nunavut') || p.includes('northwest territories')) {
    const base = 2021;
    const targetYear = base + 4 * Math.ceil((y - base) / 4);
    const d = nthWeekdayOfMonth(targetYear, 9, 1, 3);
    return { date: d, estimated: true, rule: 'Estimated: every 4 years, third Monday in October' };
  }
  // Fallback: third Monday in October every 4 years from nearest base 2022
  {
    const base = 2022;
    const targetYear = base + 4 * Math.ceil((y - base) / 4);
    const d = nthWeekdayOfMonth(targetYear, 9, 1, 3);
    return { date: d, estimated: true, rule: 'Estimated: every 4 years, third Monday in October' };
  }
}

export function nextFederalElectionDate(fromDate = new Date()): { date: Date; estimated: boolean; rule: string } {
  // Fixed-date law targets third Monday in October in the fourth year after the previous GE (subject to change/early writ)
  const base = 2021; // last GE: 2021-09-20 (fixed-date would be 2025-10-20)
  const y = fromDate.getUTCFullYear();
  const targetYear = y <= 2025 ? 2025 : base + 4 * Math.ceil((y - base) / 4);
  const d = nthWeekdayOfMonth(targetYear, 9, 1, 3); // Oct, Monday, 3rd
  return { date: d, estimated: true, rule: 'Fixed-date: third Monday in October in the fourth year (subject to early dissolution)' };
}


