import { defineBuildConfig } from "unbuild"
import { glob } from "glob"
import path from "path"

const files = await glob("scripts/src/*.ts")
const entries = files.map((file) => {
  const base = path.basename(file, ".ts")
  return {
    input: file,
    name: base,
  }
})

export default defineBuildConfig({
  entries: entries,
  outDir: "scripts/dist",
  declaration: false,
  clean: true,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      target: "esnext",
      minify: true,
    },
  },
})
