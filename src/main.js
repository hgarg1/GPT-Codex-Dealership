import './style.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const setActiveNav = () => {
  const path = window.location.pathname
  const currentFile = path.endsWith('/') ? 'index.html' : path.split('/').pop()
  document.querySelectorAll('.nav a').forEach((link) => {
    const href = link.getAttribute('href') || ''
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }
    const hrefFile = href.split('#')[0] || 'index.html'
    const isActive = hrefFile === currentFile
    link.classList.toggle('active', isActive)
    if (isActive) {
      link.setAttribute('aria-current', 'page')
    } else {
      link.removeAttribute('aria-current')
    }
  })
}

setActiveNav()

const navToggle = document.querySelector('.nav-toggle')
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open')
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
  })
}

const navLinks = document.querySelectorAll('.nav a')
if (navLinks.length) {
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 820 && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open')
        navToggle?.setAttribute('aria-expanded', 'false')
      }
    })
  })
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 820 && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open')
    navToggle?.setAttribute('aria-expanded', 'false')
  }
})

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

const heroTitles = document.querySelectorAll('[data-split]')
if (heroTitles.length) {
  heroTitles.forEach(splitText)
}

if (!prefersReducedMotion) {
  heroTitles.forEach((title, index) => {
    gsap.from(title.querySelectorAll('.split-word'), {
      yPercent: 120,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.06,
      delay: index * 0.2
    })
  })

  gsap.from('.hero .reveal', {
    opacity: 0,
    y: 20,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.1,
    delay: 0.3
  })

  gsap.to('.hero-glow', {
    yPercent: -20,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  })

  gsap.utils.toArray('[data-stagger]').forEach((group) => {
    const items = group.querySelectorAll('.reveal')
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

  gsap.utils.toArray('.section .section-title, .section .section-sub').forEach((element) => {
    gsap.from(element, {
      opacity: 0,
      y: 26,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%'
      }
    })
  })

  gsap.utils.toArray('.panel-layer').forEach((layer, index) => {
    gsap.to(layer, {
      y: -20 * (index + 1),
      ease: 'none',
      scrollTrigger: {
        trigger: '.craftsmanship-panel',
        start: 'top 70%',
        end: 'bottom top',
        scrub: true
      }
    })
  })

  gsap.utils.toArray('[data-parallax]').forEach((card) => {
    const image = card.querySelector('img')
    if (!image) return
    gsap.to(image, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: card,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    })
  })
} else {
  document.documentElement.classList.add('reduced-motion')
}
