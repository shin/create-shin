const semver = require("semver")
const packageJson = require("../package.json")

if (!semver.satisfies(process.version, packageJson.engines.node)) {
  console.error(
    `\n❌ Node.js ${packageJson.engines.node} is required, but you're using ${process.version}\n`
  )
  process.exit(1)
}
