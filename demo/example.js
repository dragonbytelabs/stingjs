const sting = window.sting
if (!sting) {
  console.error("[demo] window.sting not found. Did sting.global.js load?")
}

/**
 * PROFILE
 * Exercises:
 * - store + produce
 * - signal
 * - x-model (input)
 * - x-show
 * - x-text
 * - x-debug
 * - MutationObserver cleanup via destroyMe()
 */
sting.data("profile", () => {
  const [user, setUser] = sting.store({ name: "Sam" })
  const [open, setOpen] = sting.signal(true)
  const [glow, setGlow] = sting.signal(0)

  const toggle = () => {
    setOpen(o => !o)
    setGlow(n => (n + 1) % 4)
  }

  const rename = () => setUser(sting.produce(d => { d.name = "Frodo" }))

  const destroyMe = () => {
    document.querySelector('[x-data="profile"]')?.remove()
  }

  // derived-ish UI string (kept simple; you can later add memo/computed helpers)
  const glowLevel = () => {
    const n = glow()
    return n === 0 ? "none" : n === 1 ? "faint" : n === 2 ? "bright" : "blinding"
  }

  return {
    user,
    get open() { return open() },
    $open: open,
    glowLevel,
    toggle,
    rename,
    destroyMe,
  }
})

/**
 * COUNTER
 * Exercises:
 * - signal updates
 * - multiple handlers
 * - x-debug on primitive signal
 */
sting.data("counter", () => {
  const [count, setCount] = sting.signal(0)

  const inc = () => setCount(c => c + 1)
  const dec = () => setCount(c => c - 1)
  const reset = () => setCount(0)

  const mood = () => {
    const c = count()
    if (c <= -2) return "Mordor-core"
    if (c < 0) return "suspicious"
    if (c === 0) return "neutral"
    if (c < 3) return "vibing"
    return "overclocked"
  }

  return {
    $count: count,
    inc,
    dec,
    reset,
    mood,
  }
})

/**
 * FORM LAB
 * Exercises:
 * - x-model on select + checkbox
 * - string/boolean bindings
 */
sting.data("formLab", () => {
  const [role, setRole] = sting.signal("burglar")
  const [stealthMode, setStealthMode] = sting.signal(false)

  const summary = () => {
    return `${role()} | stealth=${stealthMode() ? "ON" : "OFF"}`
  }

  return {
    // x-model needs to be able to write back; you’re using setPath so getters must be settable.
    // For primitives, expose as plain properties backed by signals:
    get role() { return role() },
    set role(v) { setRole(String(v)) },
    $role: role,

    get stealthMode() { return stealthMode() },
    set stealthMode(v) { setStealthMode(!!v) },
    $stealthMode: stealthMode,

    summary,
  }
})
