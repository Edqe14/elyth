import { spawn } from "child_process";

const args = process.argv.slice(2);
const runArgs = ["run"];

if (args.includes("--watch") || args.includes("-w")) {
  runArgs.push("--watch");

  // Remove the watch flag
  const index = args.indexOf("--watch");
  if (index !== -1) args.splice(index, 1);

  const indexShort = args.indexOf("-w");
  if (indexShort !== -1) args.splice(indexShort, 1);
}

runArgs.push("src/app/console/mvc.ts");

const child = spawn("bun", [...runArgs, ...args], {
  stdio: "inherit",
});

// Forward exit code
child.on("close", (code) => process.exit(code));

process.on("SIGINT", () => {
  child.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  child.kill();
  process.exit();
});
