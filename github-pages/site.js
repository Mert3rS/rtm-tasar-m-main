(() => {
  const header = document.querySelector('[data-header]')
  const menuButton = document.querySelector('[data-menu-button]')
  const mobileNavigation = document.querySelector('#mobile-navigation')

  const closeMenu = () => {
    if (!(menuButton instanceof HTMLButtonElement) || !(mobileNavigation instanceof HTMLElement)) return
    menuButton.setAttribute('aria-expanded', 'false')
    menuButton.setAttribute('aria-label', 'Menüyü aç')
    mobileNavigation.hidden = true
    document.body.classList.remove('menu-open')
  }

  if (menuButton instanceof HTMLButtonElement && mobileNavigation instanceof HTMLElement) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true'
      menuButton.setAttribute('aria-expanded', String(!open))
      menuButton.setAttribute('aria-label', open ? 'Menüyü aç' : 'Menüyü kapat')
      mobileNavigation.hidden = open
      document.body.classList.toggle('menu-open', !open)
    })

    mobileNavigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu))
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu()
    })
  }

  const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 16)
  syncHeader()
  window.addEventListener('scroll', syncHeader, { passive: true })

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const revealElements = document.querySelectorAll('.reveal')
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'))
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    )
    revealElements.forEach((element) => observer.observe(element))
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear())
  })
})()
