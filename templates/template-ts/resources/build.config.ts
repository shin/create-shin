import { defineBuildConfig } from "unbuild"
import { glob } from "glob"

const entries = await glob("src/*")

export default defineBuildConfig({
  entries: entries,
  outDir: "dist",
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
