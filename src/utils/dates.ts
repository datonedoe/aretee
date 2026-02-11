import { format, addDays, differenceInDays, isToday, isTomorrow, isYesterday } from 'date-fns'

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function parseDate(dateString: string): Date | null {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, year, month, day] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days)
}

export function getDaysDifference(date1: Date, date2: Date): number {
  return differenceInDays(date1, date2)
}

export function formatRelativeDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'

  const days = differenceInDays(date, new Date())
  if (days > 0 && days <= 7) return `In ${days} days`
  if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`

  return format(date, 'MMM d, yyyy')
}

export function formatInterval(days: number): string {
  if (days === 0) return 'Now'
  if (days === 1) return '1d'
  if (days < 30) return `${days}d`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? '1mo' : `${months}mo`
  }
  const years = Math.floor(days / 365)
  return years === 1 ? '1y' : `${years}y`
}
