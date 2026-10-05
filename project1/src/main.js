import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app'),
})

// --- Resizable panes ---------------------------------------------------

const MIN = 10 // minimum pane width, in percent
const STEP = 2 // percent moved per arrow-key press

const panes = document.querySelector('.panes')
const paneEls = [...panes.querySelectorAll('.pane')]
const dividers = [...panes.querySelectorAll('.divider')]

// Pane widths as percentages (always sum to 100).
let widths = [10, 80, 10]

function render() {
  paneEls.forEach((el, i) => {
    el.style.flex = `${widths[i]} 1 0%`
  })
  dividers.forEach((el, i) => {
    const pos = widths.slice(0, i + 1).reduce((a, b) => a + b, 0)
    el.setAttribute('aria-valuenow', Math.round(pos))
  })
}

function resize(i, delta, base) {
  const d = Math.max(MIN - base[i], Math.min(base[i + 1] - MIN, delta))
  const next = [...base]
  next[i] += d
  next[i + 1] -= d
  widths = next
  render()
}

dividers.forEach((divider, i) => {
  let startX = 0
  let startWidths = []
  let totalPx = 1

  divider.addEventListener('pointerdown', (e) => {
    startX = e.clientX
    startWidths = [...widths]
    totalPx = paneEls.reduce((sum, el) => sum + el.offsetWidth, 0)
    divider.setPointerCapture(e.pointerId)
    divider.classList.add('active')
    panes.classList.add('dragging')
  })

  divider.addEventListener('pointermove', (e) => {
    if (!divider.hasPointerCapture(e.pointerId)) return
    resize(i, ((e.clientX - startX) / totalPx) * 100, startWidths)
  })

  const end = () => {
    divider.classList.remove('active')
    panes.classList.remove('dragging')
  }
  divider.addEventListener('pointerup', end)
  divider.addEventListener('pointercancel', end)

  divider.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowLeft' ? -STEP : e.key === 'ArrowRight' ? STEP : 0
    if (!step) return
    e.preventDefault()
    resize(i, step, widths)
  })
})

render()

// --- Temperature --------------------------------------------------------

const TEMP_MIN = 60
const TEMP_MAX = 90
let temp = 70

const clampTemp = (value) => Math.max(TEMP_MIN, Math.min(TEMP_MAX, value))

function setTemp(value) {
  temp = clampTemp(value)
  document.querySelectorAll('[data-temp]').forEach((el) => {
    el.textContent = temp
  })
}

document.querySelectorAll('[data-temp-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    setTemp(temp + Number(btn.dataset.tempStep))
  })
})

setTemp(temp)

// --- Softness -----------------------------------------------------------

const SOFTNESS_MIN = 1
const SOFTNESS_MAX = 10
let softness = 5

// Word for each softness level, indexed by value (1 = stiffest, 10 = softest).
const SOFTNESS_LABELS = [
  null,
  'Super stiff',
  'Very stiff',
  'Stiff',
  'Medium stiff',
  'Medium',
  'Medium',
  'Medium soft',
  'Soft',
  'Very soft',
  'Super soft',
]

function setSoftness(value) {
  softness = Math.max(SOFTNESS_MIN, Math.min(SOFTNESS_MAX, value))
  document.querySelectorAll('[data-softness]').forEach((el) => {
    el.textContent = softness
  })
  document.querySelectorAll('[data-softness-label]').forEach((el) => {
    el.textContent = SOFTNESS_LABELS[softness]
  })
}

document.querySelectorAll('[data-softness-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    setSoftness(softness + Number(btn.dataset.softnessStep))
  })
})

setSoftness(softness)

// --- Temperature plan: schedule or lie-down -----------------------------

function setTempMode(mode) {
  document.querySelectorAll('[data-temp-mode]').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.tempMode === mode)
  })
  document.querySelectorAll('[data-temp-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.tempPanel !== mode
  })
}

document.querySelectorAll('[data-temp-mode]').forEach((btn) => {
  btn.addEventListener('click', () => setTempMode(btn.dataset.tempMode))
})

// Schedule timeline. It runs noon to noon so the night sits in the middle.

const DAY = 24 * 60
const DAY_START = 12 * 60
const SNAP = 15 // minutes
const DRAG_THRESHOLD = 4 // px before a press on a point becomes a drag

const timeline = document.querySelector('[data-timeline]')
const timelineLine = document.querySelector('[data-timeline-line]')
const timelineArea = document.querySelector('[data-timeline-area]')
const timelineNow = document.querySelector('[data-timeline-now]')
const timelineHint = document.querySelector('[data-timeline-hint]')
const timelineRemove = document.querySelector('[data-timeline-remove]')

// Each change sets `temp` at `time` (minutes after midnight) and holds it
// until the next change.
let schedule = []
let selected = null

// Timeline x in minutes from DAY_START (0..DAY), and y in percent from the top.
// Temperatures use the middle 70% of the height so labels don't clip.
const toX = (time) => (time - DAY_START + DAY) % DAY
const toY = (t) => 15 + ((TEMP_MAX - t) / (TEMP_MAX - TEMP_MIN)) * 70

function formatTime(time) {
  const h = Math.floor(time / 60)
  const m = String(time % 60).padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

// Convert a pointer position on the timeline to a snapped { time, temp }.
function valuesAt(e) {
  const r = timeline.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
  const y = (((e.clientY - r.top) / r.height) * 100 - 15) / 70
  const offset = Math.min(Math.round((x * DAY) / SNAP) * SNAP, DAY - SNAP)
  return {
    time: (offset + DAY_START) % DAY,
    temp: clampTemp(Math.round(TEMP_MAX - y * (TEMP_MAX - TEMP_MIN))),
  }
}

function addChange(values) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'timeline-point'
  el.append(document.createElement('span'))
  timeline.append(el)

  const change = { ...values, el }
  el.addEventListener('focus', () => select(change))
  el.addEventListener('keydown', (e) => onPointKey(e, change))
  schedule.push(change)
  return change
}

function removeChange(change) {
  change.el.remove()
  schedule = schedule.filter((c) => c !== change)
  if (selected === change) selected = null
  renderSchedule()
}

function select(change) {
  selected = change
  renderSchedule()
}

function renderSchedule() {
  const sorted = [...schedule].sort((a, b) => toX(a.time) - toX(b.time))

  for (const c of sorted) {
    c.el.style.left = `${(toX(c.time) / DAY) * 100}%`
    c.el.style.top = `${toY(c.temp)}%`
    c.el.firstChild.textContent = `${c.temp}°`
    c.el.classList.toggle('selected', c === selected)
    c.el.setAttribute('aria-label', `${formatTime(c.time)}, ${c.temp}°F`)
  }

  // Step line; before the first change, the last change is still in effect.
  let d = ''
  if (sorted.length) {
    d = `M0 ${toY(sorted.at(-1).temp)}`
    for (const c of sorted) d += ` H${toX(c.time)} V${toY(c.temp)}`
    d += ` H${DAY}`
  }
  timelineLine.setAttribute('d', d)
  timelineArea.setAttribute('d', d && `${d} V100 H0 Z`)

  timelineHint.textContent = selected
    ? `${formatTime(selected.time)} → ${selected.temp}°F`
    : 'Tap the timeline to add a change'
  timelineRemove.hidden = !selected
}

function onPointKey(e, change) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    removeChange(change)
    return
  }
  const moves = { ArrowLeft: [-SNAP, 0], ArrowRight: [SNAP, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
  const move = moves[e.key]
  if (!move) return
  e.preventDefault()
  change.time = (change.time + move[0] + DAY) % DAY
  change.temp = clampTemp(change.temp + move[1])
  renderSchedule()
}

// Press on empty space adds a change; press on a point selects it; drag moves it.
let drag = null // { change, x, y, moved }

timeline.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  const point = e.target.closest('.timeline-point')
  const change = point ? schedule.find((c) => c.el === point) : addChange(valuesAt(e))
  drag = { change, x: e.clientX, y: e.clientY, moved: !point }
  timeline.setPointerCapture(e.pointerId)
  change.el.focus({ preventScroll: true })
  select(change)
})

timeline.addEventListener('pointermove', (e) => {
  if (!drag || !timeline.hasPointerCapture(e.pointerId)) return
  if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_THRESHOLD) return
  drag.moved = true
  Object.assign(drag.change, valuesAt(e))
  renderSchedule()
})

const endDrag = () => {
  drag = null
}
timeline.addEventListener('pointerup', endDrag)
timeline.addEventListener('pointercancel', endDrag)

timelineRemove.addEventListener('click', () => {
  if (selected) removeChange(selected)
})

function renderNow() {
  const now = new Date()
  timelineNow.style.left = `${(toX(now.getHours() * 60 + now.getMinutes()) / DAY) * 100}%`
}

setInterval(renderNow, 60 * 1000)
renderNow()

// A starting plan: cool down for sleep, cooler still overnight, warm to wake.
;[
  { time: 20 * 60, temp: 68 },
  { time: 6 * 60 + 30, temp: 72 },
].forEach(addChange)
renderSchedule()

// Lie-down: switch to a target temperature some minutes after the pillow
// detects weight.

const DELAY_MAX = 60 // minutes
const lieDown = { temp: 68, delay: 15 }

function renderLieDown() {
  document.querySelector('[data-liedown-temp-value]').textContent = lieDown.temp
  document.querySelector('[data-liedown-delay-value]').textContent = lieDown.delay
}

document.querySelectorAll('[data-liedown-temp]').forEach((btn) => {
  btn.addEventListener('click', () => {
    lieDown.temp = clampTemp(lieDown.temp + Number(btn.dataset.liedownTemp))
    renderLieDown()
  })
})

document.querySelectorAll('[data-liedown-delay]').forEach((btn) => {
  btn.addEventListener('click', () => {
    lieDown.delay = Math.max(0, Math.min(DELAY_MAX, lieDown.delay + Number(btn.dataset.liedownDelay)))
    renderLieDown()
  })
})

renderLieDown()

// --- Sleep history (demo data) ------------------------------------------

const SAMPLE = 5 // minutes between movement samples
const TICK = 15 // minutes between axis ticks
const NIGHTS = 14
const WEEK = 7 * 24 * 60 * 60 * 1000
const SVG_NS = 'http://www.w3.org/2000/svg'

// Seeded random numbers so the demo nights are the same on every load.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// One night: when sleep was detected, how long it lasted (minutes), movement
// as [minute, 0–100] samples, the minutes when snoring was heard, and the
// user's 0–5 star score (0 = not scored).
function makeNight(daysAgo, rand) {
  const start = new Date()
  start.setDate(start.getDate() - daysAgo)
  start.setHours(22, 15 + Math.floor(rand() * 90), 0, 0)
  const duration = 360 + Math.floor(rand() * 150)

  // Restless while falling asleep and waking up, with light-sleep peaks
  // between roughly 90-minute sleep cycles.
  const cycle = 80 + rand() * 20
  const times = []
  for (let t = 0; t < duration; t += SAMPLE) times.push(t)
  times.push(duration)
  const movement = times.map((t) => {
    const light = (Math.cos(((t % cycle) / cycle) * 2 * Math.PI) * 0.5 + 0.5) ** 3
    const edge = Math.max(0, 1 - t / 40) + Math.max(0, 1 - (duration - t) / 40)
    const spike = rand() < 0.04 ? 30 : 0
    return [t, Math.round(Math.min(100, 6 + 30 * light + 55 * edge + 12 * rand() + spike))]
  })

  const snores = []
  if (rand() < 0.45) {
    const count = 1 + Math.floor(rand() * 4)
    for (let i = 0; i < count; i++) snores.push(45 + Math.floor(rand() * (duration - 90)))
    snores.sort((a, b) => a - b)
  }

  const rating = daysAgo <= 3 ? 0 : 2 + Math.floor(rand() * 4)
  return { start, duration, movement, snores, rating }
}

const rand = seeded(7)
// Newest first.
let nights = Array.from({ length: NIGHTS }, (_, i) => makeNight(i + 1, rand))

const minuteOfDay = (date) => date.getHours() * 60 + date.getMinutes()
const average = (values) => values.reduce((a, b) => a + b, 0) / values.length
// Average times of day across midnight by measuring them from noon.
const averageTime = (times) => (Math.round(average(times.map(toX))) + DAY_START) % DAY

const formatDuration = (min) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`
const formatOffset = (min) => `+${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
const formatHour = (time) => `${Math.floor(time / 60) % 12 || 12}${time < 12 * 60 ? 'a' : 'p'}`

// Hide axis labels that would overlap a neighbour at the axis's current size.
// The first and last labels win; middle labels are dropped left to right.
const AXIS_LABEL_GAP = 6 // px kept clear between labels

function declutterAxis(axis) {
  const spans = [...axis.children]
  const rects = spans.map((s) => s.getBoundingClientRect())
  const last = spans.length - 1
  let right = -Infinity
  spans.forEach((span, i) => {
    const r = rects[i]
    const clearOfLast = i === last || r.right + AXIS_LABEL_GAP <= rects[last].left
    const show = i === 0 || (r.left >= right + AXIS_LABEL_GAP && clearOfLast)
    span.style.visibility = show ? '' : 'hidden'
    if (show) right = r.right
  })
}

const axisObserver = new ResizeObserver((entries) => {
  for (const entry of entries) declutterAxis(entry.target)
})

axisObserver.observe(document.querySelector('.plan-panel .timeline-axis'))

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

// Movement chart for one night, with red dotted lines where snoring was heard.
// The x axis counts up from 0 (relative), or shows clock time from when sleep
// was detected (clock). Ticks every 15 minutes, longer on the hour.
function sleepChart(night, clock) {
  const { duration } = night
  const startTime = minuteOfDay(night.start)
  const base = clock ? startTime : 0

  const chart = document.createElement('div')
  chart.className = 'sleep-chart'

  const yLabel = document.createElement('span')
  yLabel.className = 'sleep-chart-y'
  yLabel.textContent = 'Movement →'
  yLabel.setAttribute('aria-hidden', 'true')

  const snoreText = night.snores.length
    ? `, snoring heard ${night.snores.length} time${night.snores.length > 1 ? 's' : ''}`
    : ', no snoring'
  const plot = svgEl('svg', {
    class: 'sleep-chart-plot',
    viewBox: `0 0 ${duration} 100`,
    preserveAspectRatio: 'none',
    role: 'img',
    'aria-label': `Movement over ${formatDuration(duration)} of sleep${snoreText}`,
  })
  const d = night.movement.map(([t, v], i) => `${i ? 'L' : 'M'}${t} ${100 - v}`).join(' ')
  plot.append(svgEl('path', { class: 'area', d: `${d} V100 H0 Z` }), svgEl('path', { class: 'line', d }))
  for (const t of night.snores) plot.append(svgEl('line', { class: 'snore', x1: t, x2: t, y1: 0, y2: 100 }))

  const ticks = svgEl('svg', {
    class: 'sleep-chart-ticks',
    viewBox: `0 0 ${duration} 10`,
    preserveAspectRatio: 'none',
    'aria-hidden': 'true',
  })
  const labels = document.createElement('div')
  labels.className = 'timeline-axis sleep-chart-x'
  labels.setAttribute('aria-hidden', 'true')
  const label = (t, text) => {
    const span = document.createElement('span')
    span.style.left = `${(t / duration) * 100}%`
    span.textContent = text
    labels.append(span)
  }

  label(0, clock ? formatTime(startTime) : '0')
  for (let t = (TICK - (base % TICK)) % TICK; t <= duration; t += TICK) {
    const onHour = (base + t) % 60 === 0
    ticks.append(svgEl('line', { x1: t, x2: t, y1: 0, y2: onHour ? 10 : 5 }))
    if (onHour && t > 0 && t < duration) {
      label(t, clock ? formatHour((base + t) % DAY) : `+${t / 60}h`)
    }
  }
  label(duration, clock ? formatTime((startTime + duration) % DAY) : formatOffset(duration))

  chart.append(yLabel, plot, ticks, labels)
  axisObserver.observe(labels)
  return chart
}

// Tile: the most recent night, plus hours slept over the past week.
function renderSleepTile() {
  const chart = document.querySelector('[data-sleep-chart]')
  if (nights.length) {
    chart.replaceChildren(sleepChart(nights[0], false))
  } else {
    const empty = document.createElement('p')
    empty.className = 'hint'
    empty.textContent = 'No sleep recorded'
    chart.replaceChildren(empty)
  }

  const week = nights.filter((n) => Date.now() - n.start.getTime() < WEEK)
  document.querySelector('[data-sleep-avg]').textContent = week.length
    ? (average(week.map((n) => n.duration)) / 60).toFixed(1)
    : '—'
}

// History page --------------------------------------------------------------

const sleepStats = document.querySelector('[data-sleep-stats]')
const sleepList = document.querySelector('[data-sleep-list]')
const sleepEmpty = document.querySelector('[data-sleep-empty]')

const STAR_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2.5 14.9 8.6 21.5 9.3 16.5 13.8 17.9 20.4 12 17 6.1 20.4 7.5 13.8 2.5 9.3 9.1 8.6" /></svg>'
const TRASH_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 7 20 7" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></svg>'

function nightName(night) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (night.start.toDateString() === yesterday.toDateString()) return 'Last night'
  return night.start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function renderSleepStats() {
  const has = nights.length > 0
  const scored = nights.filter((n) => n.rating)
  const snored = nights.filter((n) => n.snores.length).length
  const stats = [
    ['Avg bedtime', has ? formatTime(averageTime(nights.map((n) => minuteOfDay(n.start)))) : '—'],
    ['Avg wake-up', has ? formatTime(averageTime(nights.map((n) => (minuteOfDay(n.start) + n.duration) % DAY))) : '—'],
    ['Avg sleep', has ? formatDuration(Math.round(average(nights.map((n) => n.duration)))) : '—'],
    ['Nights snoring', has ? `${Math.round((100 * snored) / nights.length)}%` : '—'],
    ['Avg movement', has ? `${Math.round(average(nights.map((n) => average(n.movement.map(([, v]) => v)))))}%` : '—'],
    ['Avg score', scored.length ? `${average(scored.map((n) => n.rating)).toFixed(1)} ★` : '—'],
  ]
  sleepStats.replaceChildren(
    ...stats.map(([name, value]) => {
      const item = document.createElement('div')
      const dt = document.createElement('dt')
      const dd = document.createElement('dd')
      dt.textContent = name
      dd.textContent = value
      item.append(dt, dd)
      return item
    }),
  )
}

function renderStars(night) {
  night.el.querySelectorAll('.star').forEach((star, i) => {
    star.classList.toggle('on', i < night.rating)
    star.setAttribute('aria-pressed', i + 1 === night.rating)
  })
}

// Pressing the current score again clears it.
function rateNight(night, rating) {
  night.rating = night.rating === rating ? 0 : rating
  renderStars(night)
  renderSleepStats()
}

function deleteNight(night) {
  // Keep keyboard focus in the list: move it to the neighbouring entry.
  const i = nights.indexOf(night)
  const neighbour = nights[i + 1] ?? nights[i - 1]
  if (night.el.contains(document.activeElement) && neighbour) {
    neighbour.el.querySelector('.delete-btn').focus({ preventScroll: true })
  }

  night.el.remove()
  nights = nights.filter((n) => n !== night)
  sleepEmpty.hidden = nights.length > 0
  renderSleepStats()
  renderSleepTile()
}

function sleepEntry(night) {
  const name = nightName(night)
  const li = document.createElement('li')
  li.className = 'sleep-entry'
  night.el = li

  const date = document.createElement('p')
  date.className = 'sleep-entry-date'
  date.textContent = name

  const total = document.createElement('p')
  total.className = 'sleep-entry-total'
  total.textContent = formatDuration(night.duration)

  const stars = document.createElement('div')
  stars.className = 'stars'
  stars.setAttribute('role', 'group')
  stars.setAttribute('aria-label', `Score sleep from ${name}`)
  for (let n = 1; n <= 5; n++) {
    const star = document.createElement('button')
    star.type = 'button'
    star.className = 'star'
    star.innerHTML = STAR_SVG
    star.setAttribute('aria-label', `${n} star${n > 1 ? 's' : ''}`)
    star.addEventListener('click', () => rateNight(night, n))
    stars.append(star)
  }

  const side = document.createElement('div')
  side.className = 'sleep-entry-side'
  side.append(total, stars)

  const del = document.createElement('button')
  del.type = 'button'
  del.className = 'delete-btn'
  del.innerHTML = TRASH_SVG
  del.setAttribute('aria-label', `Delete sleep from ${name}`)
  del.addEventListener('click', () => deleteNight(night))

  li.append(date, sleepChart(night, true), side, del)
  renderStars(night)
  return li
}

sleepList.append(...nights.map(sleepEntry))
renderSleepStats()
renderSleepTile()

// --- Alarms -------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const GRADUAL_MIN = 15 // minutes the pillow spends gently waking you before the alarm

// `time` is minutes after midnight. `days` has one flag per weekday, Sunday
// first; with no days set the alarm rings once. `label` is optional ('').
let alarms = [
  { label: 'Work', time: 6 * 60 + 30, days: [false, true, true, true, true, true, false], enabled: true, gradual: true },
  { label: '', time: 8 * 60 + 30, days: [true, false, false, false, false, false, true], enabled: true, gradual: true },
  { label: '', time: 7 * 60 + 15, days: Array(7).fill(false), enabled: false, gradual: false },
]

// The alarm ringing right now, if any. It rings until silenced.
let ringing = null

const repeats = (alarm) => alarm.days.some(Boolean)
const pad2 = (n) => String(n).padStart(2, '0')

// ['6:30', 'AM'], for showing the AM/PM smaller than the time.
const timeParts = (time) => formatTime(time).split(' ')

function htmlEl(tag, className, text) {
  const el = document.createElement(tag)
  if (className) el.className = className
  if (text != null) el.textContent = text
  return el
}

// When the alarm will next ring, after `now`.
function nextRing(alarm, now = new Date()) {
  const nowTime = minuteOfDay(now)
  for (let d = 0; d <= 7; d++) {
    if (d === 0 && alarm.time <= nowTime) continue
    if (repeats(alarm) && !alarm.days[(now.getDay() + d) % 7]) continue
    const ring = new Date(now)
    ring.setDate(now.getDate() + d)
    ring.setHours(Math.floor(alarm.time / 60), alarm.time % 60, 0, 0)
    return ring
  }
}

// "in 8 hr 14 min", "in 45 min", "in 6 d 23 hr"
function formatUntil(ring, now = new Date()) {
  const total = Math.ceil((ring - now) / 60000)
  const d = Math.floor(total / DAY)
  const h = Math.floor((total % DAY) / 60)
  const m = total % 60
  const parts = d ? [`${d} d`, h && `${h} hr`] : [h && `${h} hr`, (m || !h) && `${m} min`]
  return `in ${parts.filter(Boolean).join(' ')}`
}

// "Today", "Tomorrow", or the weekday.
function ringDay(ring, now = new Date()) {
  const days = Math.round((new Date(ring).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return ring.toLocaleDateString(undefined, { weekday: 'long' })
}

function repeatText(days) {
  const count = days.filter(Boolean).length
  if (count === 0) return 'Once'
  if (count === 7) return 'Every day'
  if (count === 5 && !days[0] && !days[6]) return 'Weekdays'
  if (count === 2 && days[0] && days[6]) return 'Weekends'
  return DAY_NAMES.filter((_, i) => days[i]).join(', ')
}

// Sun|Mon|Tue|… with the days the alarm repeats on highlighted. Non-repeating
// alarms say "Once" instead.
function daysRow(days, tag) {
  if (!days.some(Boolean)) return htmlEl(tag, 'alarm-once hint', 'Once')
  const row = htmlEl(tag, 'alarm-days')
  row.setAttribute('role', 'img')
  row.setAttribute('aria-label', `Repeats ${repeatText(days)}`)
  DAY_NAMES.forEach((name, i) => row.append(htmlEl('span', days[i] ? 'on' : '', name)))
  return row
}

function timeEl(tag, className, time) {
  const [clock, half] = timeParts(time)
  const el = htmlEl(tag, className, clock)
  el.append(htmlEl('small', '', half))
  return el
}

// The alarm in `list` that rings soonest, as { alarm, ring }.
function soonest(list, now = new Date()) {
  return list
    .map((alarm) => ({ alarm, ring: nextRing(alarm, now) }))
    .sort((a, b) => a.ring - b.ring)[0]
}

// Main screen tile: the next alarm to ring.
const alarmNext = document.querySelector('[data-alarm-next]')
const alarmTile = document.querySelector('.tile.alarm')

function renderAlarmTile() {
  const now = new Date()
  const next = ringing ? { alarm: ringing } : soonest(alarms.filter((a) => a.enabled), now)
  alarmTile.classList.toggle('ringing', !!ringing)

  if (!next) {
    alarmNext.replaceChildren(htmlEl('div', 'hint', 'No alarms on. Tap to set one.'))
    return
  }

  const { alarm, ring } = next
  const left = htmlEl('div')
  left.append(timeEl('div', 'alarm-next-time', alarm.time), daysRow(alarm.days, 'div'))
  // Always present (even blank) so it holds the middle space.
  const label = htmlEl('div', 'alarm-label', alarm.label)

  const right = htmlEl('div', 'alarm-next-when')
  if (ringing) {
    right.append(htmlEl('div', 'alarm-next-day', 'Ringing'), htmlEl('div', 'hint', 'Press the bell on the side to silence'))
  } else {
    right.append(htmlEl('div', 'alarm-next-day', ringDay(ring, now)), htmlEl('div', 'alarm-next-in', formatUntil(ring, now)))
  }
  if (alarm.gradual && !ringing) {
    right.append(htmlEl('div', 'hint', `Gradual wake-up from ${formatTime((alarm.time - GRADUAL_MIN + DAY) % DAY)}`))
  }
  alarmNext.replaceChildren(left, label, right)
}

// Alarms page ----------------------------------------------------------------

const alarmList = document.querySelector('[data-alarm-list]')
const alarmEmpty = document.querySelector('[data-alarm-empty]')
const alarmAdd = document.querySelector('[data-alarm-add]')

function alarmEntry(alarm) {
  const li = htmlEl('li', 'alarm-entry')
  const open = htmlEl('button', 'alarm-open')
  open.type = 'button'
  open.addEventListener('click', () => editAlarm(alarm, open))

  const toggle = htmlEl('button', 'switch')
  toggle.type = 'button'
  toggle.setAttribute('role', 'switch')
  toggle.addEventListener('click', () => {
    alarm.enabled = !alarm.enabled
    if (!alarm.enabled && ringing === alarm) ringing = null
    updateAlarmEntry(alarm)
    renderAlarmTile()
  })

  li.append(open, toggle)
  alarm.el = li
}

function updateAlarmEntry(alarm, now = new Date()) {
  const [open, toggle] = alarm.el.children
  const until = alarm.enabled ? formatUntil(nextRing(alarm, now), now) : 'Off'
  const name = `${alarm.label ? `${alarm.label}, ` : ''}${formatTime(alarm.time)} alarm`
  open.replaceChildren(timeEl('span', 'alarm-time', alarm.time), daysRow(alarm.days, 'span'), htmlEl('span', 'alarm-in', until))
  if (alarm.label) open.prepend(htmlEl('span', 'alarm-label', alarm.label))
  open.setAttribute('aria-label', `Edit ${name}, ${repeatText(alarm.days)}, ${until}`)
  alarm.el.classList.toggle('off', !alarm.enabled)
  toggle.setAttribute('aria-checked', alarm.enabled)
  toggle.setAttribute('aria-label', name)
}

function renderAlarms() {
  const now = new Date()
  alarms.sort((a, b) => a.time - b.time)
  for (const alarm of alarms) {
    if (!alarm.el) alarmEntry(alarm)
    updateAlarmEntry(alarm, now)
  }
  alarmList.replaceChildren(...alarms.map((a) => a.el))
  alarmEmpty.hidden = alarms.length > 0
  if (!alarms.includes(ringing)) ringing = null
  renderAlarmTile()
}

// Start ringing when an enabled alarm's minute arrives (checked once per minute).
let lastRingCheck = null

function checkRinging(now) {
  const key = `${now.toDateString()} ${minuteOfDay(now)}`
  if (key === lastRingCheck) return
  lastRingCheck = key
  const due = alarms.find(
    (a) => a.enabled && a.time === minuteOfDay(now) && (!repeats(a) || a.days[now.getDay()]),
  )
  if (due) ringing = due
}

// Keep the countdowns current without reordering (which would steal focus).
setInterval(() => {
  const now = new Date()
  checkRinging(now)
  alarms.forEach((alarm) => updateAlarmEntry(alarm, now))
  renderAlarmTile()
}, 15 * 1000)

alarmAdd.addEventListener('click', () => editAlarm(null, alarmAdd))

// Alarm editor -----------------------------------------------------------------
// The first press/drag on the dial sets the hour, then it switches to minutes.

const editor = document.querySelector('.page[data-page="alarm-edit"]')
const dial = editor.querySelector('[data-dial]')
const dialHand = editor.querySelector('[data-dial-hand]')
const dialDot = editor.querySelector('[data-dial-dot]')
const dialNumbersGroup = editor.querySelector('[data-dial-numbers]')
const dialHint = editor.querySelector('[data-dial-hint]')
const dialParts = [...editor.querySelectorAll('[data-dial-part]')]
const ampmButtons = [...editor.querySelectorAll('[data-ampm]')]
const dayPicks = [...editor.querySelectorAll('[data-day]')]
const repeatHint = editor.querySelector('[data-repeat-hint]')
const gradualSwitch = editor.querySelector('[data-gradual]')
const labelInput = editor.querySelector('[data-alarm-label]')
const deleteBtn = editor.querySelector('[data-alarm-delete]')
const DIAL_R = 74 // radius of the numbers, in dial units (the face is 98)

editor.querySelector('[data-gradual-hint]').textContent =
  `Warms and gently vibrates ${GRADUAL_MIN} min before`

// Minute ticks around the edge, longer every five minutes.
for (let i = 0; i < 60; i++) {
  const a = (i * Math.PI) / 30
  const major = i % 5 === 0
  const [r1, r2] = [major ? 86 : 90, 94]
  editor.querySelector('[data-dial-ticks]').append(
    svgEl('line', {
      class: major ? 'major' : '',
      x1: Math.sin(a) * r1, y1: -Math.cos(a) * r1,
      x2: Math.sin(a) * r2, y2: -Math.cos(a) * r2,
    }),
  )
}

const dialNumbers = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6
  const text = svgEl('text', { x: (Math.sin(a) * DIAL_R).toFixed(2), y: (-Math.cos(a) * DIAL_R).toFixed(2) })
  dialNumbersGroup.append(text)
  return text
})

let draft = null // { alarm (null when new), hour 1–12, minute, pm, days, gradual }
let dialMode = 'hour'
let handAngle = 0 // degrees; accumulates so the hand always turns the short way

function renderEditor() {
  const hour = dialMode === 'hour'

  const target = hour ? (draft.hour % 12) * 30 : draft.minute * 6
  handAngle += ((((target - handAngle) % 360) + 540) % 360) - 180
  dialHand.style.transform = `rotate(${handAngle}deg)`
  dialNumbers.forEach((text, i) => {
    text.textContent = hour ? i || 12 : pad2(i * 5)
    text.classList.toggle('on', hour ? i === draft.hour % 12 : i * 5 === draft.minute)
  })
  // Between numbers, mark the knob so it's clear the minute is in between.
  dialDot.style.visibility = !hour && draft.minute % 5 ? 'visible' : 'hidden'

  dial.setAttribute('aria-label', hour ? 'Hour' : 'Minute')
  dial.setAttribute('aria-valuemin', hour ? 1 : 0)
  dial.setAttribute('aria-valuemax', hour ? 12 : 59)
  dial.setAttribute('aria-valuenow', hour ? draft.hour : draft.minute)
  dial.setAttribute('aria-valuetext', hour ? `${draft.hour} o'clock` : `${draft.minute} minutes`)
  dialHint.textContent = hour ? 'Tap or drag the dial to set the hour' : 'Now set the minute'

  const [hourBtn, minuteBtn] = dialParts
  hourBtn.textContent = draft.hour
  minuteBtn.textContent = pad2(draft.minute)
  dialParts.forEach((btn) => btn.setAttribute('aria-pressed', btn.dataset.dialPart === dialMode))
  ampmButtons.forEach((btn) => btn.setAttribute('aria-pressed', (btn.dataset.ampm === 'pm') === draft.pm))

  dayPicks.forEach((btn, i) => btn.setAttribute('aria-pressed', draft.days[i]))
  repeatHint.textContent = repeats(draft) ? `Repeats ${repeatText(draft.days).toLowerCase()}` : 'Rings once'
  gradualSwitch.setAttribute('aria-checked', draft.gradual)
}

function setDialMode(mode) {
  if (mode === dialMode) return
  dialMode = mode
  dialNumbersGroup.animate(
    [{ opacity: 0, transform: 'scale(0.85)' }, { opacity: 1, transform: 'scale(1)' }],
    { duration: 200, easing: 'ease-out' },
  )
  renderEditor()
}

function editAlarm(alarm, origin) {
  const time = alarm?.time ?? 7 * 60
  draft = {
    alarm,
    hour: Math.floor(time / 60) % 12 || 12,
    minute: time % 60,
    pm: time >= 12 * 60,
    days: [...(alarm?.days ?? Array(7).fill(false))],
    gradual: alarm?.gradual ?? true,
  }
  labelInput.value = alarm?.label ?? ''
  dialMode = 'hour'
  editor.setAttribute('aria-label', alarm ? 'Edit alarm' : 'New alarm')
  deleteBtn.hidden = !alarm

  // Jump the hand into place rather than swinging from the last alarm.
  dial.classList.add('no-anim')
  renderEditor()
  dial.getBoundingClientRect()
  dial.classList.remove('no-anim')

  openPage('alarm-edit', origin)
}

// Angle of the pointer around the dial's center: 0° at 12, clockwise.
function dialAngle(e) {
  const r = dial.getBoundingClientRect()
  const x = e.clientX - (r.left + r.width / 2)
  const y = e.clientY - (r.top + r.height / 2)
  return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360
}

function setFromPointer(e) {
  const a = dialAngle(e)
  if (dialMode === 'hour') draft.hour = Math.round(a / 30) % 12 || 12
  else draft.minute = Math.round(a / 6) % 60
  renderEditor()
}

dial.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  dial.setPointerCapture(e.pointerId)
  dial.classList.add('dragging')
  dial.focus({ preventScroll: true })
  setFromPointer(e)
})

dial.addEventListener('pointermove', (e) => {
  if (dial.hasPointerCapture(e.pointerId)) setFromPointer(e)
})

dial.addEventListener('pointerup', () => {
  if (!dial.classList.contains('dragging')) return // press began off the dial
  dial.classList.remove('dragging')
  setDialMode('minute')
})

dial.addEventListener('pointercancel', () => dial.classList.remove('dragging'))

dial.addEventListener('keydown', (e) => {
  const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]
  if (step) {
    e.preventDefault()
    if (dialMode === 'hour') draft.hour = ((draft.hour - 1 + step + 12) % 12) + 1
    else draft.minute = (draft.minute + step + 60) % 60
    renderEditor()
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    setDialMode('minute')
  }
})

dialParts.forEach((btn) => {
  btn.addEventListener('click', () => setDialMode(btn.dataset.dialPart))
})

ampmButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    draft.pm = btn.dataset.ampm === 'pm'
    renderEditor()
  })
})

dayPicks.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    draft.days[i] = !draft.days[i]
    renderEditor()
  })
})

gradualSwitch.addEventListener('click', () => {
  draft.gradual = !draft.gradual
  renderEditor()
})

// Saving turns the alarm on, and the editor shrinks back into its entry.
editor.querySelector('[data-alarm-save]').addEventListener('click', () => {
  const values = {
    label: labelInput.value.trim(),
    time: ((draft.hour % 12) + (draft.pm ? 12 : 0)) * 60 + draft.minute,
    days: draft.days,
    gradual: draft.gradual,
    enabled: true,
  }
  const alarm = draft.alarm ? Object.assign(draft.alarm, values) : values
  if (!draft.alarm) alarms.push(alarm)
  renderAlarms()
  alarm.el.scrollIntoView({ block: 'nearest' })
  closePage(alarm.el.querySelector('.alarm-open'))
})

deleteBtn.addEventListener('click', () => {
  alarms = alarms.filter((a) => a !== draft.alarm)
  renderAlarms()
  closePage(alarmAdd)
})

renderAlarms()

// --- Expanding pages ----------------------------------------------------

// Open pages, topmost last: { origin, page }. The alarm editor opens on top
// of the alarms page.
const openPages = []

// Park the page exactly over its tile so it can grow from / shrink back to it.
// Coordinates are relative to the page's frame (its positioned parent).
function placeOverTile(page, tile) {
  const frame = page.offsetParent
  const f = frame.getBoundingClientRect()
  const t = tile.getBoundingClientRect()
  page.style.setProperty('--from-top', `${t.top - f.top - frame.clientTop}px`)
  page.style.setProperty('--from-left', `${t.left - f.left - frame.clientLeft}px`)
  page.style.setProperty('--from-width', `${t.width}px`)
  page.style.setProperty('--from-height', `${t.height}px`)
}

// Grow the named page out of `origin` (the tile or button that opened it).
function openPage(name, origin) {
  const page = panes.querySelector(`.page[data-page="${name}"]`)
  if (!page || page.classList.contains('open')) return
  placeOverTile(page, origin)
  page.getBoundingClientRect() // commit the start position before animating
  page.classList.add('open')
  const focus = page.querySelector('[data-autofocus]') ?? page.querySelector('[data-close]')
  focus.focus({ preventScroll: true })
  openPages.push({ origin, page })
}

// Close the topmost page, shrinking it back into its origin, or into
// `origin` when given (e.g. a newly saved alarm's entry).
function closePage(origin) {
  const top = openPages.pop()
  if (!top) return
  origin ??= top.origin
  placeOverTile(top.page, origin)
  top.page.classList.remove('open')
  origin.focus({ preventScroll: true })
}

document.querySelectorAll('.tile[data-page]').forEach((tile) => {
  tile.addEventListener('click', (e) => {
    if (e.target.closest('button')) return // arrow buttons don't open the page
    openPage(tile.dataset.page, tile)
  })
  tile.addEventListener('keydown', (e) => {
    if (e.target !== tile || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    openPage(tile.dataset.page, tile)
  })
})

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => closePage())
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePage()
})

// --- Side strip (physical buttons) ----------------------------------------
// No lights, so feedback is felt: the pillow buzzes three quick times when a
// setting is already at its limit.

const strip = document.querySelector('[data-strip]')

function buzz(times, gap = 220) {
  const on = Math.min(120, gap / 2)
  navigator.vibrate?.(Array.from({ length: times * 2 - 1 }, (_, i) => (i % 2 ? gap - on : on)))
  for (let i = 0; i < times; i++) {
    strip.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
      { duration: 60, iterations: 2, delay: i * gap },
    )
  }
}

// Briefly outline the tile on screen that the button changed.
function nudge(tile) {
  tile.classList.remove('nudge')
  tile.getBoundingClientRect()
  tile.classList.add('nudge')
}

// Silences the ringing alarm. The alarm stays on and rings again next time.
function silenceAlarm() {
  if (!ringing) return
  ringing = null
  renderAlarmTile()
  nudge(alarmTile)
}

const tempTile = document.querySelector('.tile[data-page="temperature"]')
const softnessTile = document.querySelector('[data-softness]').closest('.tile')

const stripActions = {
  alarm: silenceAlarm,
  'temp-up': () => stepTemp(1),
  'temp-down': () => stepTemp(-1),
  'soft-up': () => stepSoftness(1),
  'soft-down': () => stepSoftness(-1),
}

function stepTemp(step) {
  const before = temp
  setTemp(temp + step)
  if (temp === before) buzz(3, 120)
  nudge(tempTile)
}

function stepSoftness(step) {
  const before = softness
  setSoftness(softness + step)
  if (softness === before) buzz(3, 120)
  nudge(softnessTile)
}

strip.querySelectorAll('[data-strip-action]').forEach((btn) => {
  btn.addEventListener('click', () => stripActions[btn.dataset.stripAction]())
})

export default app