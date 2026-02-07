import sting from "stingjs"
import "./style.css"

sting.data("counter", () => {
  const [count, setCount] = sting.signal(0)

  const inc = () => setCount((value) => value + 1)
  const dec = () => setCount((value) => value - 1)

  return {
    count,
    inc,
    dec,
  }
})
