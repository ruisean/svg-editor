import * as readline from "node:readline";
import { SvgDocument } from "./model/SvgDocument.js";

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let document: SvgDocument | null = null;

console.log("svg-editor 0.1 — type 'help' for commands");

terminal.setPrompt("svg> ");
terminal.prompt();

terminal.on("line", (input) => {
  const parts = input.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  if (command === "help") {
    console.log("Commands: init [width] [height], help, exit");
  } else if (command === "init") {
    if (args.length !== 0 && args.length !== 2) {
      console.log("error: usage: init [width] [height]");
    } else {
      const width = args.length === 2 ? Number(args[0]) : 800;
      const height = args.length === 2 ? Number(args[1]) : 600;

      try {
        const newDocument = new SvgDocument(width, height);
        document = newDocument;
        console.log(`canvas ${document.width}x${document.height} created`);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "exit") {
    terminal.close();
    return;
  } else if (command !== "") {
    console.log(`error: unknown command: ${command}`);
  }

  terminal.prompt();
});