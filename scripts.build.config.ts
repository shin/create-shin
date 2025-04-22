import { defineBuildConfig } from "unbuild"
import { glob } from "glob"
import path from "path"

const baseDir = "scripts"
const srcDir = "src"
const outDir = "dist"

const files = await glob(`${baseDir}/${srcDir}/**/*.ts`)

const entries = files.map((file) => {
  const relativePath = path
    .relative(`${baseDir}/${srcDir}`, file)
    .replace(/\.ts$/, "")
  return {
    input: file,
    name: relativePath,
  }
})

export default defineBuildConfig({
  entries: entries,
  outDir: `${baseDir}/${outDir}`,
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
