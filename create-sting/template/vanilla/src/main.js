import sting from "sting-js"
import "./style.css"

sting.data("counter", () => {
  const [count, setCount] = sting.signal(0)

  const inc = () => setCount((n) => n + 1)
  const dec = () => setCount((n) => n - 1)

  const mood = () => {
    const value = count()
    if (value < 0) return "spicy"
    if (value === 0) return "neutral"
    if (value < 5) return "steady"
    return "overclocked"
  }

  return {
    count,
    inc,
    dec,
    mood,
  }
})
