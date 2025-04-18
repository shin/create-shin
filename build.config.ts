import { defineBuildConfig } from "unbuild"
import path from "path"

export default defineBuildConfig({
  entries: ["src/index"],
  outDir: "dist",
  clean: true,
  alias: {
    "@": path.resolve(__dirname),
  },
  rollup: {
    inlineDependencies: true,
    esbuild: {
      target: "esnext",
      minify: true,
    },
  },
})
