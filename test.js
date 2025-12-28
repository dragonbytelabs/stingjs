
import { data, store, signal, produce, start } from "./sting/sting.js"

// register components
data("profile", () => {
  const [user, setUser] = store({ name: "Sam" })
  const [open, setOpen] = signal(true)

  window.__sting = { open, setOpen }

  const toggle = () => setOpen(o => !o)
  const rename = () => setUser(produce(d => { d.name = "Frodo" }))
  const destroyMe = () => {
    document.querySelector('[x-data="profile"]')?.remove()
  }

  return {
    user,
    get open() { return open() },
    $open: open,
    toggle,
    rename,
    destroyMe,
  }
})

// boot AFTER registration
start()
