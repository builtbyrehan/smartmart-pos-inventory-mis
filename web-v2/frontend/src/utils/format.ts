export function formatDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed)
}
