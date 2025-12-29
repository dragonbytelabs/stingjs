const string = window.sting

sting.data("profile", () => {
  const [user, setUser] = sting.store({ name: "Sam" })
  const [open, setOpen] = sting.signal(true)

  const toggle = () => setOpen(o => !o)
  const rename = () => setUser(sting.produce(d => { d.name = "Frodo" }))
  const destroyMe = () => {
    document.querySelector('[x-data="profile"]')?.remove()
  }

  return {
    user, 
    get open() { return open() },
    $open: open,
    toggle, 
    rename,
    destroyMe
  }
})
