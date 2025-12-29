import esbuild from "esbuild"

const shared = {
  bundle: true,
  sourcemap: true,
  target: "es2020",
}

// --------------------
// ESM (library users)
// --------------------
await esbuild.build({
  ...shared,
  entryPoints: ["sting/entry/entry-esm.js"],
  outfile: "dist/sting.mjs",
  format: "esm",
  define: {
    __DEV__: "false",
  },
})

// --------------------
// Global build
// --------------------
await esbuild.build({
  ...shared,
  entryPoints: ["sting/entry/entry-global.js"],
  outfile: "dist/sting.global.js",
  format: "iife",
  globalName: "sting",
  define: {
    __DEV__: "false",
  },
  footer: {
    js: "window.sting = sting.default || sting;",
  },
})
