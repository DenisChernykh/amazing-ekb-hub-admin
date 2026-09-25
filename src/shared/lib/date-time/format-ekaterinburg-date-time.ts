const formatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Yekaterinburg',
  year: 'numeric',
})

export function formatEkaterinburgDateTime(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const part of formatter.formatToParts(date)) {
    parts[part.type] = part.value
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ЕКБ`
}
