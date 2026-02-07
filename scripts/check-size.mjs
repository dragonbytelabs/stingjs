import fs from "fs"
import zlib from "zlib"

const budgets = [
  { file: "dist/sting.mjs", gzipMax: 9000 },
  { file: "dist/sting.global.js", gzipMax: 9000 },
]

let failed = false

for (const budget of budgets) {
  if (!fs.existsSync(budget.file)) {
    console.error(`[size] missing build artifact: ${budget.file}`)
    failed = true
    continue
  }

  const bytes = fs.readFileSync(budget.file)
  const gzipBytes = zlib.gzipSync(bytes).length

  const status = gzipBytes <= budget.gzipMax ? "ok" : "fail"
  const line = `[size] ${budget.file} gzip=${gzipBytes}B budget=${budget.gzipMax}B ${status}`

  if (status === "ok") console.log(line)
  else {
    console.error(line)
    failed = true
  }
}

if (failed) process.exit(1)
