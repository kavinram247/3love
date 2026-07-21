export function formatGbp(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatStatus(status: string) {
  return status.toLowerCase().replace(/(^|_)\w/g, (match) => match.replace('_', ' ').toUpperCase())
}
