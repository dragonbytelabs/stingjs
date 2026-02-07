const sting = window.sting

sting.data("edgeCases", () => {
  const [user, setUser] = sting.store({ profile: { name: "Sam" } })
  const [title, setTitle] = sting.signal("ready")
  const [label, setLabel] = sting.signal("idle")

  const toggleTitle = () => {
    setTitle((prev) => (prev == null ? "ready" : null))
  }

  const setLabelWithArgs = (name, rank, active) => {
    setLabel(`${name}:${rank}:${active ? "T" : "F"}`)
  }

  const setFromEvent = (ev) => {
    setLabel(ev.type)
  }

  return {
    user,
    title,
    label,
    toggleTitle,
    setLabel: setLabelWithArgs,
    setFromEvent,
    setUser,
  }
})
