import { Command } from "commander"

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import {
  pkgFromUserAgent,
  formatTargetDir,
  isValidPackageName,
  toValidPackageName,
  isEmpty,
  emptyDir,
  getFullCustomCommand,
  copyFile,
  copyDirectory,
} from "@/src/utils/index"

import colors from "picocolors"
import * as prompts from "@clack/prompts"
import { spawn } from "cross-spawn"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const {
  bgBlue,
  bgWhite,
  bgCyan,
  blue,
  blueBright,
  cyan,
  green,
  greenBright,
  magenta,
  red,
  redBright,
  reset,
  yellow,
  white,
  black,
} = colors

interface Framework {
  name: string
  display: string
  color: (str: string) => string
}

export const init = new Command()
  .name("init")
  .description("Initialize a new project")
  .argument("[directory]", "Target directory")
  .option("-t, --template <name>", "Use a specific template")
  .option("-w, --overwrite", "Overwrite if directory exists")
  .addHelpText(
    "after",
    `
Available templates:
  ${blue("ts")}                      typescript
    `
  )
  .action(async (directory, options) => {
    prompts.intro(bgCyan(black(" create-shin ")))

    const cwd = process.cwd()

    type Overwrite = symbol | "yes" | "no" | "ignore" | undefined

    const FRAMEWORKS: Framework[] = [
      {
        name: "ts",
        display: "Typescript",
        color: white,
      },
    ]

    const TEMPLATES = FRAMEWORKS.map((f) => f.name)

    const defaultTargetDir = "shin-project"

    async function init() {
      const argTargetDir = directory
        ? formatTargetDir(String(directory))
        : undefined
      const argTemplate = options.template
      const argOverwrite = options.overwrite

      const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
      const cancel = () => prompts.cancel("Operation cancelled")

      // 1. Get project name and target dir
      let targetDir = argTargetDir
      if (!targetDir) {
        const projectName = await prompts.text({
          message: "Project name:",
          defaultValue: defaultTargetDir,
          placeholder: defaultTargetDir,
        })
        if (prompts.isCancel(projectName)) return cancel()
        targetDir = formatTargetDir(projectName as string)
      }

      // 2. Handle directory if exist and not empty
      let overwrite: Overwrite
      if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
        overwrite = argOverwrite
          ? "yes"
          : await prompts.select({
              message:
                (targetDir === "."
                  ? "Current directory"
                  : `Target directory "${targetDir}"`) +
                ` is not empty. Please choose how to proceed:`,
              options: [
                {
                  label: "Cancel operation",
                  value: "no",
                },
                {
                  label: "Remove existing files and continue",
                  value: "yes",
                },
                {
                  label: "Ignore files and continue",
                  value: "ignore",
                },
              ],
            })
        if (prompts.isCancel(overwrite)) return cancel()
        if (overwrite === "no") return cancel()
      }

      // 3. Get package name
      let packageName = path.basename(path.resolve(targetDir))
      if (!isValidPackageName(packageName)) {
        const packageNameResult = await prompts.text({
          message: "Package name:",
          defaultValue: toValidPackageName(packageName),
          placeholder: toValidPackageName(packageName),
          validate(dir) {
            if (!isValidPackageName(dir)) {
              return "Invalid package.json name"
            }
          },
        })
        if (prompts.isCancel(packageNameResult)) return cancel()
        packageName = packageNameResult
      }

      // 4. Choose a framework and variant
      let template = argTemplate
      let hasInvalidArgTemplate = false
      if (argTemplate && !TEMPLATES.includes(argTemplate)) {
        template = undefined
        hasInvalidArgTemplate = true
      }
      if (!template) {
        const framework = await prompts.select({
          message: hasInvalidArgTemplate
            ? `"${argTemplate}" isn't a valid template. Please choose from below: `
            : "Select a template:",
          options: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              label: frameworkColor(framework.display || framework.name),
              value: framework,
            }
          }),
        })
        if (prompts.isCancel(framework)) return cancel()

        template = framework.name
      }

      const root = path.join(cwd, targetDir)
      fs.mkdirSync(root, { recursive: true })

      const pkgManager = pkgInfo ? pkgInfo.name : "npm"

      // 5. Make resources
      const templateDir = path.resolve(
        __dirname,
        "..",
        "templates",
        `template-${template}`
      )
      const resourcesDir = path.resolve(templateDir, "resources")

      const transformFiles = ["package.json"]
      const files = fs
        .readdirSync(resourcesDir)
        .filter((file) => !transformFiles.includes(file))

      if (files.length > 0) {
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(resourcesDir, `package.json`), "utf-8")
        )

        packageJson.name = packageName

        const output0 = await runMakeResources(
          overwrite,
          root,
          resourcesDir,
          files,
          "Making resources",
          packageJson
        )
        console.log(output0)
      }

      // 6. Install packages
      interface InstallPackages {
        dependencies: string[]
        devDependencies: string[]
      }

      const installPackages: InstallPackages = JSON.parse(
        fs.readFileSync(
          path.resolve(templateDir, "install-packages.json"),
          "utf-8"
        )
      )

      // Install dependencies
      if (installPackages && installPackages.dependencies.length > 0) {
        const output1 = await runInstall(
          root,
          pkgManager,
          ["install", ...installPackages.dependencies],
          "Installing dependencies"
        )

        console.log(output1)
      }

      // Install devDependencies
      if (installPackages && installPackages.devDependencies.length > 0) {
        const output2 = await runInstall(
          root,
          pkgManager,
          ["install", "-D", ...installPackages.devDependencies],
          "Installing devDependencies"
        )
        console.log(output2)
      }

      let doneMessage = ""
      const cdProjectName = path.relative(cwd, root)
      doneMessage += `Done. Now run:\n`
      if (root !== cwd) {
        doneMessage += `\n   cd ${cdProjectName}`
      }
      switch (pkgManager) {
        default:
          doneMessage += `\n   ${pkgManager} run dev`
          break
      }
      prompts.outro(doneMessage)
    }

    const runMakeResources = async (
      overwrite: Overwrite,
      rootDir: string,
      sourceDir: string,
      sources: string[],
      initialMessage: string,
      packageJson: any
    ) => {
      return new Promise((resolve, reject) => {
        const spin = prompts.spinner()
        spin.start(initialMessage)

        let output = "\n"

        try {
          if (overwrite === "yes") {
            output += `   Remove all files in:\n\n`
            output += `     ${rootDir}\n\n`
            emptyDir(rootDir)
          }

          if (!fs.existsSync(rootDir)) {
            fs.mkdirSync(rootDir, { recursive: true })
          }

          sources.forEach((filePath: string) => {
            const srcPath = path.resolve(sourceDir, filePath)
            const destPath = path.resolve(rootDir, filePath)

            const stat = fs.statSync(srcPath)
            if (stat.isDirectory()) {
              output += `   Create directory:    ${filePath}\n`
              copyDirectory(srcPath, destPath)
            } else {
              output += `   Create file:         ${filePath}\n`
              copyFile(srcPath, destPath)
            }
          })

          // Create transformed files
          fs.writeFileSync(
            path.resolve(rootDir, "package.json"),
            JSON.stringify(packageJson, null, 2) + "\n"
          )
          output += `   Create file:         package.json\n`

          spin.stop(`${initialMessage} - Completed`)
          resolve(output)
        } catch (error) {
          spin.stop(`${initialMessage} - Failed`)
          reject(error)
        }
      })
    }

    const runInstall = async (
      rootDir: string,
      command: string,
      args: string[],
      initialMessage: string
    ) => {
      return new Promise((resolve, reject) => {
        const spin = prompts.spinner()
        spin.start(initialMessage)

        const process = spawn(command, args, {
          cwd: rootDir,
          shell: true,
        })
        let output = "\n"

        process.stdout.on("data", (data) => {
          const message = data.toString().trim()
          const messages = message
            .split("\n")
            .map((row: string) => `   ${row} \n`)
          output += messages.join("\n")
        })

        process.stderr.on("data", (data) => {
          const message = data.toString().trim()
          const messages = message
            .split("\n")
            .map((row: string) => `   ${row} \n`)
          output += messages.join("\n")
        })

        process.on("close", (code) => {
          if (code === 0) {
            spin.stop(`${initialMessage} - Completed`)
            resolve(output)
          } else {
            spin.stop(`${initialMessage} - Failed with code ${code}`)
            reject(new Error(`Process exited with code ${code}`))
          }
        })

        process.on("error", (err) => {
          spin.stop(`${initialMessage} - Error: ${err.message}`)
          reject(err)
        })
      })
    }

    init().catch((e) => {
      console.error(e)
    })
  })
