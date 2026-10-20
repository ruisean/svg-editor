import * as readline from "node:readline";

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("svg-editor 0.1 — type 'help' for commands");

terminal.setPrompt("svg> ");
terminal.prompt();

terminal.on("line", (input) => {
  const command = input.trim();

  if (command === "help") {
    console.log("Commands: help, exit");
  } else if (command === "exit") {
    terminal.close();
    return;
  } else if (command !== "") {
    console.log(`error: unknown command: ${command}`);
  }

  terminal.prompt();
});