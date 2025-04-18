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

  // Check if first arg is a known subcommand
  const knownCommands = program.commands.map((cmd) => cmd.name())
  const firstArg = args[0]

  const isKnownCommand = knownCommands.includes(firstArg)

  if (!firstArg || firstArg.startsWith("-") || !isKnownCommand) {
    // Default to running the init command if no arguments are given
    program.parse(["node", "create-shin", "init", ...args])
  } else {
    program.parse(process.argv)
  }
}

main()
