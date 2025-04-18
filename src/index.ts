import { init } from "@/src/commands/index"

import packageJson from "@/package.json"
import { Command } from "commander"

async function main() {
  const program = new Command()
    .name("create-shin")
    .description("add components and dependencies to your project")
    .version(packageJson.version, "-v, --version", "display the version number")

  program.addCommand(init)
  const args = process.argv.slice(2)
  program.parse(["node", "create-shin", "init", ...args])
}

main()
