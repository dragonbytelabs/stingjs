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
  const glowLevel = sting.computed(() => {
    const n = glow()
    return n === 0 ? "none" : n === 1 ? "faint" : n === 2 ? "bright" : "blinding"
  })

  return {
    user,
    open,
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

/**
 * CLASS LAB
 * Exercises:
 * - x-bind:class with object syntax
 * - x-bind:title
 * - signals + computed
 */
sting.data("classLab", () => {
  const [hot, setHot] = sting.signal(false)
  const [danger, setDanger] = sting.signal(false)
  const [boops, setBoops] = sting.signal(0)

  const toggleHot = () => setHot(v => !v)
  const toggleDanger = () => setDanger(v => !v)
  const reset = () => { setHot(false); setDanger(false); setBoops(0) }
  const boop = () => setBoops(n => n + 1)

  // object syntax: { className: boolean }
  const btnClass = sting.computed(() => ({
    good: hot(),      // re-use your existing CSS .btn.good border
    bad: danger(),    // re-use your existing CSS .btn.bad border
    // add your own classes too (see CSS note below)
    "is-hot": hot(),
    "is-danger": danger(),
  }))

  const classPreview = sting.computed(() => {
    const c = btnClass()
    return Object.entries(c).filter(([, on]) => on).map(([k]) => k).join(" ") || "(none)"
  })

  const titleText = sting.computed(() => {
    const bits = []
    if (hot()) bits.push("🔥 hot")
    if (danger()) bits.push("☠️ danger")
    if (bits.length === 0) bits.push("😌 calm")
    return `Boops=${boops()} | ${bits.join(" + ")}`
  })

  return {
    // debug
    $hot: hot,
    $danger: danger,

    // handlers
    toggleHot,
    toggleDanger,
    reset,
    boop,

    // bound values
    btnClass,
    classPreview,
    titleText,
  }
})

/**
 * IF LAB
 * Exercises:
 * - x-if on <template>
 * - hydration of inserted nodes (x-text, x-on, x-model)
 * - toggling inserts/removes DOM repeatedly
 */
sting.data("ifLab", () => {
  const [open, setOpen] = sting.signal(false)
  const [clicks, setClicks] = sting.signal(0)
  const [name, setName] = sting.signal("Gandalf")

  const toggle = () => setOpen(v => !v)
  const reset = () => { setOpen(false); setClicks(0); setName("Gandalf") }
  const inc = () => setClicks(n => n + 1)

  const openLabel = sting.computed(() => (open() ? "true" : "false"))

  return {
    // state used by x-if / x-text
    open,
    openLabel,
    clicks,

    // x-model needs setter if it’s a primitive
    get name() { return name() },
    set name(v) { setName(String(v)) },

    // handlers
    toggle,
    reset,
    inc,
  }
})

sting.data("forLab", () => {
  const [items, setItems] = sting.signal(["Gandalf", "Aragorn", "Legolas"])

  const add = () => setItems(xs => xs.concat(`Hobbit-${xs.length + 1}`))
  const pop = () => setItems(xs => xs.slice(0, -1))
  const reset = () => setItems(["Gandalf", "Aragorn", "Legolas"])

  // This is the one “gap”: without eval, remove(i) needs to be a function on scope.
  // We'll expose remove(index) that returns a handler.
  const remove = (i) => () => setItems(xs => xs.filter((_, idx) => idx !== i))

  const len = sting.computed(() => items().length)

  return { items, add, pop, reset, remove, len }
})

