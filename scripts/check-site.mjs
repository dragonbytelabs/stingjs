import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

const requiredFiles = [
  "site/index.html",
  "site/docs/index.html",
  "site/assets/styles.css",
  "site/assets/site.js",
]

for (const rel of requiredFiles) {
  const abs = path.join(root, rel)
  await fs.access(abs)
}

const home = await fs.readFile(path.join(root, "site/index.html"), "utf8")
const docs = await fs.readFile(path.join(root, "site/docs/index.html"), "utf8")

assertIncludes(home, "StingJS", "home title content missing")
assertIncludes(home, "./docs/index.html", "home docs link missing")
assertIncludes(home, "npm create sting@latest", "home scaffold command missing")

assertIncludes(docs, "id=\"quickstart\"", "docs quickstart section missing")
assertIncludes(docs, "id=\"directives\"", "docs directives section missing")
assertIncludes(docs, "../assets/styles.css", "docs stylesheet path missing")

console.log("[site:check] site files and key sections are present")

function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    throw new Error(`[site:check] ${message}: expected to find ${JSON.stringify(needle)}`)
  }
}
