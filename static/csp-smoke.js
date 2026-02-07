const sting = window.sting

sting.data("cspCounter", () => {
  const [count, setCount] = sting.signal(0)
  const inc = () => setCount((n) => n + 1)

  return { count, inc }
})
