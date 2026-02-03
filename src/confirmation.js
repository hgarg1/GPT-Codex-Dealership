import './main.js'

const baseTimeZone = 'America/New_York'

const zonedTimeToUtc = (year, month, day, hour, minute, timeZone) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const tzDate = new Date(utcGuess.toLocaleString('en-US', { timeZone }))
  const offset = utcGuess.getTime() - tzDate.getTime()
  return new Date(utcGuess.getTime() + offset)
}

const formatDateLabel = (dateValue, timeZone) => {
  if (!dateValue) return ''
  const [year, month, day] = dateValue.split('-').map(Number)
  const anchorUtc = zonedTimeToUtc(year, month, day, 12, 0, baseTimeZone)
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(anchorUtc)
}

const formatICSDate = (date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const second = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hour}${minute}${second}Z`
}

const stored = sessionStorage.getItem('apexAppointment')
const appointment = stored ? JSON.parse(stored) : null

const lead = document.querySelector('[data-confirm-lead]')
const nameField = document.querySelector('[data-confirm-name]')
const dateField = document.querySelector('[data-confirm-date]')
const timeField = document.querySelector('[data-confirm-time]')
const zoneField = document.querySelector('[data-confirm-zone]')
const channelField = document.querySelector('[data-confirm-channel]')
const googleLink = document.querySelector('[data-calendar-google]')
const icsLink = document.querySelector('[data-calendar-ics]')

if (appointment) {
  const dateLabel = formatDateLabel(appointment.dateValue, appointment.timeZone)
  if (lead && dateLabel && appointment.timeLabel) {
    lead.textContent = `We have reserved ${dateLabel} at ${appointment.timeLabel} (${appointment.timeZoneLabel}).`
  }

  if (nameField) nameField.textContent = appointment.name || 'Guest'
  if (dateField) dateField.textContent = dateLabel || 'To be confirmed'
  if (timeField) timeField.textContent = appointment.timeLabel || 'To be confirmed'
  if (zoneField) zoneField.textContent = appointment.timeZoneLabel || appointment.timeZone || 'Local'
  if (channelField) channelField.textContent = appointment.channel || 'Email'

  if (appointment.utc && googleLink && icsLink) {
    const start = new Date(appointment.utc)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const startValue = formatICSDate(start)
    const endValue = formatICSDate(end)

    const details = encodeURIComponent(
      'Your private Apex Motor Co. appointment. A concierge advisor will share arrival notes and a vehicle dossier.'
    )
    const location = encodeURIComponent('214 Meridian Avenue, Suite 810, New York, NY 10010')
    const title = encodeURIComponent('Apex Motor Co. Private Appointment')

    const googleUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}` +
      `&dates=${startValue}/${endValue}&details=${details}&location=${location}&ctz=${appointment.timeZone}`

    googleLink.href = googleUrl

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Apex Motor Co//Appointment//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startValue}`,
      `DTEND:${endValue}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    icsLink.href = url
    icsLink.download = 'apex-appointment.ics'
  }
} else {
  if (lead) {
    lead.textContent =
      'Your appointment details will appear here once you submit a concierge request.'
  }
  if (googleLink) googleLink.setAttribute('aria-disabled', 'true')
  if (icsLink) icsLink.setAttribute('aria-disabled', 'true')
}
