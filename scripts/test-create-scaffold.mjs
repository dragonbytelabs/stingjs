import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")
const cliPath = path.join(repoRoot, "create-sting", "bin", "create-sting.js")

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sting-create-smoke-"))

try {
  await runCase({
    name: "javascript",
    outDir: path.join(tempRoot, "js-app"),
    template: "javascript",
    expectedMain: "src/main.js",
    expectedPackageChecks: [
      ["devDependencies.vite", "^7.3.1"],
      ["dependencies.sting-js", "^1.0.0"],
      ["scripts.dev", "vite"],
    ],
  })

  await runCase({
    name: "typescript",
    outDir: path.join(tempRoot, "ts-app"),
    template: "typescript",
    expectedMain: "src/main.ts",
    expectedFiles: ["tsconfig.json", "src/sting-js.d.ts"],
    expectedPackageChecks: [
      ["devDependencies.typescript", "^5.9.3"],
      ["scripts.typecheck", "tsc --noEmit"],
      ["dependencies.sting-js", "^1.0.0"],
    ],
  })

  console.log("[create:smoke] all checks passed")
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true })
}

async function runCase({ name, outDir, template, expectedMain, expectedFiles = [], expectedPackageChecks = [] }) {
  console.log(`[create:smoke] scaffolding ${name} template`)

  const result = spawnSync(process.execPath, [cliPath, outDir, "--yes", "--template", template], {
    cwd: repoRoot,
    encoding: "utf8",
  })

  if (result.error) {
    throw new Error(`failed to run create-sting for ${name}: ${result.error.message}`)
  }

  if (result.status !== 0) {
    throw new Error(`create-sting failed for ${name}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
  }

  await assertFile(path.join(outDir, "index.html"), `${name}: missing index.html`)
  await assertFile(path.join(outDir, expectedMain), `${name}: missing ${expectedMain}`)
  await assertContains(path.join(outDir, "index.html"), "x-data=\"counter\"", `${name}: starter page missing counter root`)
  await assertContains(path.join(outDir, "index.html"), "Increase", `${name}: starter page missing increase button`)
  await assertContains(path.join(outDir, "index.html"), "Decrease", `${name}: starter page missing decrease button`)

  for (const relPath of expectedFiles) {
    await assertFile(path.join(outDir, relPath), `${name}: missing ${relPath}`)
  }

  const pkg = JSON.parse(await fs.readFile(path.join(outDir, "package.json"), "utf8"))

  for (const [keyPath, expected] of expectedPackageChecks) {
    const actual = readDeep(pkg, keyPath)
    if (actual !== expected) {
      throw new Error(`${name}: expected package.json ${keyPath}=${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`)
    }
  }

  console.log(`[create:smoke] ${name} template ok`)
}

async function assertFile(filePath, errorMessage) {
  try {
    await fs.access(filePath)
  } catch {
    throw new Error(errorMessage)
  }
}

async function assertContains(filePath, text, errorMessage) {
  const body = await fs.readFile(filePath, "utf8")
  if (!body.includes(text)) {
    throw new Error(errorMessage)
  }
}

function readDeep(value, keyPath) {
  return keyPath.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object") return acc[key]
    return undefined
  }, value)
}
