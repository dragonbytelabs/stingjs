import path from "node:path"
import process from "node:process"
import os from "node:os"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const argv = process.argv.slice(2)
const dryRun = argv.includes("--dry-run")
const accessPublic = argv.includes("--public")
const tag = getFlagValue("--tag", argv)

const packages = [
  {
    name: "create-sting-app",
    dir: path.join(repoRoot, "create-sting-app"),
  },
  {
    name: "create-sting",
    dir: path.join(repoRoot, "create-sting"),
  },
]

const env = {
  ...process.env,
  NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE || path.join(os.tmpdir(), "sting-npm-cache"),
}

console.log("[release:create] publish order:")
for (const pkg of packages) {
  console.log(`- ${pkg.name}`)
}

for (const pkg of packages) {
  const args = ["publish"]

  if (dryRun) {
    args.push("--dry-run")
  }

  if (accessPublic) {
    args.push("--access", "public")
  }

  if (tag) {
    args.push("--tag", tag)
  }

  console.log(`\n[release:create] ${pkg.name}: npm ${args.join(" ")}`)
  const result = spawnSync("npm", args, {
    cwd: pkg.dir,
    env,
    stdio: "inherit",
  })

  if (result.error) {
    console.error(`\n[release:create] failed to run npm for ${pkg.name}: ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`\n[release:create] publish failed for ${pkg.name}`)
    process.exit(result.status || 1)
  }
}

console.log("\n[release:create] done")

function getFlagValue(flag, args) {
  const prefixed = `${flag}=`

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]

    if (arg === flag) {
      return args[i + 1] || ""
    }

    if (arg.startsWith(prefixed)) {
      return arg.slice(prefixed.length)
    }
  }

  return ""
}
