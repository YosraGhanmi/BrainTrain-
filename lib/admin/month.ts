// "YYYY-MM" <-> the first-of-month Date it names, used to scope
// admin dashboard cards/pages to one month at a time via ?month=.
export function parseMonthParam(month: string | undefined): { year: number; monthIndex: number } {
  const match = month?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) return { year, monthIndex };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

export function monthParamFor(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function monthNav(month: string | undefined) {
  const { year, monthIndex } = parseMonthParam(month);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);
  const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonthParam = monthParamFor(monthIndex === 0 ? year - 1 : year, monthIndex === 0 ? 11 : monthIndex - 1);
  const nextMonthParam = monthParamFor(monthIndex === 11 ? year + 1 : year, monthIndex === 11 ? 0 : monthIndex + 1);
  const isCurrentMonth = monthParamFor(year, monthIndex) === monthParamFor(new Date().getFullYear(), new Date().getMonth());

  return { year, monthIndex, monthStart, monthEnd, monthLabel, prevMonthParam, nextMonthParam, isCurrentMonth };
}
