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
  const knownCommands = program.commands.map((cmd) => cmd.name())
  const firstArg = args[0]

  const shouldRunDefault =
    !firstArg || firstArg.startsWith("-") || !knownCommands.includes(firstArg)

  // Run default 'init' command if no known command is specified
  const finalArgs = shouldRunDefault
    ? ["node", "create-shin", "init", ...args]
    : process.argv

  await program.parseAsync(finalArgs)
}

await main()
