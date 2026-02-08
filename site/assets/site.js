(function initSite() {
  const navToggle = document.querySelector("[data-nav-toggle]")
  const navMenu = document.querySelector("[data-nav-menu]")

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("open")
      navToggle.setAttribute("aria-expanded", String(open))
    })

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("open")
        navToggle.setAttribute("aria-expanded", "false")
      })
    })
  }

  // Optional docs section highlighting.
  const sidebarLinks = Array.from(document.querySelectorAll("[data-doc-link]"))
  const sections = sidebarLinks
    .map((link) => {
      const id = link.getAttribute("href")
      if (!id || !id.startsWith("#")) return null
      const section = document.querySelector(id)
      if (!section) return null
      return { link, section }
    })
    .filter(Boolean)

  if (sections.length > 0 && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        sections.forEach(({ link }) => link.classList.remove("active"))
        const matched = sections.find(({ section }) => section === entry.target)
        if (matched) matched.link.classList.add("active")
      }
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 })

    sections.forEach(({ section }) => observer.observe(section))
  }
})()
