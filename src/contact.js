import './main.js'
import { gsap } from 'gsap'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const baseTimeZone = 'America/New_York'
const timeZones = [
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Chicago', label: 'Chicago (CT)' },
  { value: 'America/Denver', label: 'Denver (MT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' }
]

const scheduleTabs = document.querySelectorAll('.schedule-tab')
const scheduleDates = document.querySelector('.schedule-dates')
const scheduleTimes = document.querySelector('.schedule-times')
const scheduleSummary = document.querySelector('.schedule-summary')
const zoneSelect = document.querySelector('select[name="time_zone"]')
const dateInput = document.querySelector('input[name="preferred_date"]')
const timeInput = document.querySelector('input[name="preferred_time"]')
const utcInput = document.querySelector('input[name="preferred_utc"]')

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const defaultZone = timeZones.some((zone) => zone.value === localZone) ? localZone : baseTimeZone
let activeZone = defaultZone
let activeMode = 'weekday'
let activeDateValue = ''
let activeTimeLabel = ''
let activeUtcISO = ''

const toValueDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (date, offset) => {
  const next = new Date(date)
  next.setDate(next.getDate() + offset)
  return next
}

const zonedTimeToUtc = (year, month, day, hour, minute, timeZone) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const tzDate = new Date(utcGuess.toLocaleString('en-US', { timeZone }))
  const offset = utcGuess.getTime() - tzDate.getTime()
  return new Date(utcGuess.getTime() + offset)
}

const formatDateParts = (dateValue, timeZone) => {
  const [year, month, day] = dateValue.split('-').map(Number)
  const anchorUtc = zonedTimeToUtc(year, month, day, 12, 0, baseTimeZone)
  const dayLabel = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(anchorUtc)
  const monthDayLabel = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric'
  }).format(anchorUtc)
  const fullLabel = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(anchorUtc)
  return { dayLabel, monthDayLabel, fullLabel }
}

const formatTime = (utcDate, timeZone) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit'
  }).format(utcDate)

const timeOptions = {
  weekday: [
    { hour: 9, minute: 0 },
    { hour: 11, minute: 30 },
    { hour: 14, minute: 0 },
    { hour: 16, minute: 30 }
  ],
  weekend: [
    { hour: 10, minute: 0 },
    { hour: 12, minute: 30 },
    { hour: 15, minute: 0 }
  ]
}

const blackoutOffsets = [2, 7, 12, 18]
const blackoutDates = new Set(blackoutOffsets.map((offset) => toValueDate(addDays(new Date(), offset))))

const getDateValues = (mode) => {
  const dates = []
  const today = new Date()
  for (let i = 0; i < 21; i += 1) {
    const date = addDays(today, i)
    const day = date.getDay()
    const isWeekend = day === 0 || day === 6
    if ((mode === 'weekend' && isWeekend) || (mode === 'weekday' && !isWeekend)) {
      dates.push(toValueDate(date))
    }
  }
  return dates
}

const zoneLabel = () => timeZones.find((zone) => zone.value === activeZone)?.label || activeZone

const updateSummary = () => {
  if (!scheduleSummary) return
  if (!activeDateValue || !activeTimeLabel) {
    scheduleSummary.textContent = 'Select a date and time to reserve an appointment.'
    return
  }
  const { fullLabel } = formatDateParts(activeDateValue, activeZone)
  scheduleSummary.textContent = `Selected: ${fullLabel} - ${activeTimeLabel} (${zoneLabel()})`
}

const setActiveTab = (mode) => {
  scheduleTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode
    tab.classList.toggle('active', isActive)
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
  })
}

const selectDateButton = (button) => {
  scheduleDates?.querySelectorAll('.schedule-date').forEach((item) => {
    item.classList.remove('active')
    item.setAttribute('aria-selected', 'false')
  })
  button.classList.add('active')
  button.setAttribute('aria-selected', 'true')
  activeDateValue = button.dataset.value || ''
  if (dateInput) dateInput.value = activeDateValue
  renderTimes(activeMode)
  updateSummary()
  if (!prefersReducedMotion) {
    gsap.fromTo(button, { scale: 0.98 }, { scale: 1, duration: 0.3, ease: 'power2.out' })
  }
}

const renderDates = (mode) => {
  if (!scheduleDates) return
  scheduleDates.innerHTML = ''
  const values = getDateValues(mode)
  let firstAvailable = null

  values.forEach((value) => {
    const { dayLabel, monthDayLabel } = formatDateParts(value, activeZone)
    const isBlocked = blackoutDates.has(value)

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'schedule-date'
    button.dataset.value = value
    button.setAttribute('role', 'option')
    button.innerHTML = `<span>${dayLabel}</span><strong>${monthDayLabel}</strong>`

    if (isBlocked) {
      button.classList.add('is-disabled')
      button.disabled = true
    } else if (!firstAvailable) {
      firstAvailable = button
    }

    if (!isBlocked) {
      button.addEventListener('click', () => selectDateButton(button))
    }

    scheduleDates.appendChild(button)
  })

  const existing = scheduleDates.querySelector(
    `.schedule-date[data-value="${activeDateValue}"]:not(.is-disabled)`
  )
  const target = existing || firstAvailable
  if (target) {
    selectDateButton(target)
  }
}

const selectTimeButton = (button) => {
  scheduleTimes?.querySelectorAll('.schedule-time').forEach((item) => {
    item.classList.remove('active')
    item.setAttribute('aria-selected', 'false')
  })
  button.classList.add('active')
  button.setAttribute('aria-selected', 'true')
  activeTimeLabel = button.textContent || ''
  activeUtcISO = button.dataset.utc || ''
  if (timeInput) timeInput.value = activeTimeLabel
  if (utcInput) utcInput.value = activeUtcISO
  updateSummary()
  if (!prefersReducedMotion) {
    gsap.fromTo(button, { scale: 0.96 }, { scale: 1, duration: 0.25, ease: 'power2.out' })
  }
}

const renderTimes = (mode) => {
  if (!scheduleTimes || !activeDateValue) return
  scheduleTimes.innerHTML = ''
  const [year, month, day] = activeDateValue.split('-').map(Number)
  const slots = timeOptions[mode] || []

  slots.forEach((slot, index) => {
    const utcDate = zonedTimeToUtc(year, month, day, slot.hour, slot.minute, baseTimeZone)
    const label = formatTime(utcDate, activeZone)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'schedule-time'
    button.textContent = label
    button.setAttribute('role', 'option')
    button.dataset.utc = utcDate.toISOString()

    if (index === 0) {
      button.classList.add('active')
      button.setAttribute('aria-selected', 'true')
      activeTimeLabel = label
      activeUtcISO = button.dataset.utc
      if (timeInput) timeInput.value = label
      if (utcInput) utcInput.value = button.dataset.utc
    }

    button.addEventListener('click', () => selectTimeButton(button))
    scheduleTimes.appendChild(button)
  })
}

const renderSchedule = (mode) => {
  activeMode = mode
  setActiveTab(mode)
  renderDates(mode)
  updateSummary()
}

const initZoneSelect = () => {
  if (!zoneSelect) return
  zoneSelect.innerHTML = ''
  timeZones.forEach((zone) => {
    const option = document.createElement('option')
    option.value = zone.value
    option.textContent = zone.label
    if (zone.value === activeZone) option.selected = true
    zoneSelect.appendChild(option)
  })

  zoneSelect.addEventListener('change', (event) => {
    activeZone = event.target.value
    renderSchedule(activeMode)
  })
}

if (scheduleTabs.length && scheduleDates && scheduleTimes) {
  scheduleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode
      if (mode && mode !== activeMode) {
        renderSchedule(mode)
      }
    })
  })
  initZoneSelect()
  renderSchedule(activeMode)
}

const contactForm = document.querySelector('.contact-form--lux')
const formSuccess = contactForm?.querySelector('.form-success')
const resetButton = contactForm?.querySelector('[data-reset]')
const confirmSummary = contactForm?.querySelector('[data-confirm-summary]')

if (contactForm && formSuccess) {
  formSuccess.hidden = true
  contactForm.classList.remove('is-submitted')
}

if (contactForm && formSuccess) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const formData = new FormData(contactForm)
    const payload = {
      name: formData.get('full_name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      vehicleInterest: formData.get('vehicle_interest') || '',
      channel: formData.get('channel') || '',
      message: formData.get('message') || '',
      dateValue: activeDateValue,
      timeLabel: activeTimeLabel,
      utc: activeUtcISO,
      timeZone: activeZone,
      timeZoneLabel: zoneLabel()
    }

    sessionStorage.setItem('apexAppointment', JSON.stringify(payload))

    if (confirmSummary && payload.dateValue && payload.timeLabel) {
      const { fullLabel } = formatDateParts(payload.dateValue, payload.timeZone)
      confirmSummary.textContent = `Selected: ${fullLabel} - ${payload.timeLabel} (${payload.timeZoneLabel})`
    }

    contactForm.classList.add('is-submitted')
    formSuccess.hidden = false
    if (!prefersReducedMotion) {
      gsap.fromTo(
        formSuccess,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
    }
  })
}

if (resetButton && contactForm && formSuccess) {
  resetButton.addEventListener('click', () => {
    contactForm.classList.remove('is-submitted')
    formSuccess.hidden = true
  })
}

const attachTilt = (element, maxTilt = 6) => {
  if (!element || prefersReducedMotion) return
  const handleMove = (event) => {
    const rect = element.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    const rotateX = (-y * maxTilt).toFixed(2)
    const rotateY = (x * maxTilt).toFixed(2)
    element.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }
  const handleLeave = () => {
    element.style.transform = ''
  }
  element.addEventListener('pointermove', handleMove)
  element.addEventListener('pointerleave', handleLeave)
}

if (!prefersReducedMotion) {
  document.querySelectorAll('.contact-hero-stage').forEach((el) => attachTilt(el, 6))
  document.querySelectorAll('.journey-step').forEach((el) => attachTilt(el, 4))

  gsap.to('.stage-glass', {
    y: -6,
    duration: 3,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  })
}
