import fs from "fs"
import path from "path"

interface PkgInfo {
  name: string
  version: string
}

function pkgFromUserAgent(userAgent: string | undefined): PkgInfo | undefined {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(" ")[0]
  const pkgSpecArr = pkgSpec.split("/")
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, "")
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z\d\-~]+/g, "-")
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === ".git")
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === ".git") {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function getFullCustomCommand(customCommand: string, pkgInfo?: PkgInfo) {
  const pkgManager = pkgInfo ? pkgInfo.name : "npm"
  const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.")

  return (
    customCommand
      .replace(/^npm create (?:-- )?/, () => {
        // `bun create` uses it's own set of templates,
        // the closest alternative is using `bun x` directly on the package
        if (pkgManager === "bun") {
          return "bun x create-"
        }
        // pnpm doesn't support the -- syntax
        if (pkgManager === "pnpm") {
          return "pnpm create "
        }
        // For other package managers, preserve the original format
        return customCommand.startsWith("npm create -- ")
          ? `${pkgManager} create -- `
          : `${pkgManager} create `
      })
      // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace("@latest", () => (isYarn1 ? "" : "@latest"))
      .replace(/^npm exec/, () => {
        // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
        if (pkgManager === "pnpm") {
          return "pnpm dlx"
        }
        if (pkgManager === "yarn" && !isYarn1) {
          return "yarn dlx"
        }
        if (pkgManager === "bun") {
          return "bun x"
        }
        // Use `npm exec` in all other cases,
        // including Yarn 1.x and other custom npm clients.
        return "npm exec"
      })
  )
}

const copyFile = (src: string, dest: string) => {
  const destDir = path.dirname(dest)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  fs.copyFileSync(src, dest)
}

const copyDirectory = (src: string, dest: string) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const files = fs.readdirSync(src)
  files.forEach((file: string) => {
    const srcPath = path.resolve(src, file)
    const destPath = path.resolve(dest, file)

    const stat = fs.statSync(srcPath)
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      copyFile(srcPath, destPath)
    }
  })
}

export {
  pkgFromUserAgent,
  formatTargetDir,
  isValidPackageName,
  toValidPackageName,
  isEmpty,
  emptyDir,
  getFullCustomCommand,
  copyFile,
  copyDirectory,
}
