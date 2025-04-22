import { defineBuildConfig } from "unbuild"
import path from "path"
import alias from "@rollup/plugin-alias"

const baseDir = "."
const srcDir = "src"
const outDir = "dist"

export default defineBuildConfig({
  entries: [`${baseDir}/${srcDir}/index`],
  outDir: `${baseDir}/${outDir}`,
  clean: true,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      target: "esnext",
      minify: true,
    },
  },
  hooks: {
    "rollup:options"(ctx, options) {
      options.plugins = [
        alias({
          entries: [
            {
              find: "@",
              replacement: path.resolve(baseDir),
            },
          ],
        }),
        ...(options.plugins || []),
      ]
    },
  },
})
