export function formatJobTitles(titles: string[]): string {
  if (!titles || titles.length === 0) return '';

  if (titles.length === 1) {
    return titles[0];
  }

  if (titles.length === 2) {
    return `${titles[0]} & ${titles[1]}`;
  }

  const allButLast = titles.slice(0, -1).join(', ');
  return `${allButLast} & ${titles[titles.length - 1]}`;
}
