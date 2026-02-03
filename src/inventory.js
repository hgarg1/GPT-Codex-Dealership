import './style.css'
import './main.js'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const splitText = (element) => {
  const text = element.textContent.trim()
  if (!text) return
  element.setAttribute('aria-label', text)
  element.textContent = ''
  const words = text.split(' ')
  words.forEach((word, index) => {
    const span = document.createElement('span')
    span.className = 'split-word'
    span.setAttribute('aria-hidden', 'true')
    span.textContent = word
    element.appendChild(span)
    if (index < words.length - 1) {
      element.appendChild(document.createTextNode(' '))
    }
  })
}

const splitTargets = document.querySelectorAll('[data-split]')
if (splitTargets.length) {
  splitTargets.forEach(splitText)
}

const filterButtons = document.querySelectorAll('.filter-btn')
const panels = Array.from(document.querySelectorAll('.inventory-panel'))
const countElement = document.querySelector('[data-count]')
const barFill = document.querySelector('.availability-bar span')
const totalCount = panels.length

const setActiveButton = (activeButton) => {
  filterButtons.forEach((button) => {
    const isActive = button === activeButton
    button.classList.toggle('active', isActive)
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
  })
}

const applyFilter = (filter) => {
  const matches = []
  panels.forEach((panel) => {
    const categories = panel.dataset.category.split(' ')
    const isMatch = filter === 'all' || categories.includes(filter)
    panel.style.display = isMatch ? '' : 'none'
    if (isMatch) matches.push(panel)
  })

  if (countElement) {
    countElement.textContent = matches.length
  }
  if (barFill) {
    const ratio = totalCount ? matches.length / totalCount : 0
    const clamped = Math.max(0.15, ratio)
    barFill.style.width = `${clamped * 100}%`
  }

  if (!prefersReducedMotion && matches.length) {
    gsap.fromTo(
      matches,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08
      }
    )
  }
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter
    setActiveButton(button)
    applyFilter(filter)
  })
})

if (!prefersReducedMotion) {
  splitTargets.forEach((title, index) => {
    gsap.from(title.querySelectorAll('.split-word'), {
      yPercent: 120,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.06,
      delay: index * 0.2
    })
  })

  gsap.from('.inventory-intro .eyebrow, .inventory-intro .section-sub, .inventory-intro .hero-actions', {
    opacity: 0,
    y: 24,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.1
  })

  gsap.from('.inventory-visual', {
    opacity: 0,
    scale: 0.98,
    duration: 1,
    ease: 'power3.out'
  })

  gsap.utils.toArray('[data-stagger]').forEach((group) => {
    const items = group.querySelectorAll('.inventory-panel')
    gsap.from(items, {
      opacity: 0,
      y: 24,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: group,
        start: 'top 80%'
      }
    })
  })

  gsap.utils.toArray('.panel-media img, .inventory-visual img').forEach((image) => {
    gsap.to(image, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: image,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    })
  })
}

applyFilter('all')
if (filterButtons[0]) {
  setActiveButton(filterButtons[0])
}
