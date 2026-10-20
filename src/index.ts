import * as readline from "node:readline";
import { SvgDocument } from "./model/SvgDocument.js";
import { RectShape } from "./model/shapes/RectShape.js";

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
    console.log("Commands: init [width] [height], canvas [width] [height], create rect <id> <x> <y> <width> <height> [fill], show <id>,help, exit");
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
  } else if (command === "create") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args[0] !== "rect") {
      console.log(`error: unknown shape type: ${args[0] ?? ""}`);
    } else if (args.length !== 6 && args.length !== 7) {
      console.log("error: usage: create rect <id> <x> <y> <width> <height> [fill]");
    } else {
      try {
        const shape = new RectShape(
          args[1],
          Number(args[2]),
          Number(args[3]),
          Number(args[4]),
          Number(args[5]),
          args[6],
        );
        document.addShape(shape);
        console.log(`rect#${shape.id} created`);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "show") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 1) {
      console.log("error: usage: show <id>");
    } else {
      const shape = document.getShape(args[0]);

      if (shape === undefined) {
        console.log(`error: no such shape: ${args[0]}`);
      } else {
        console.log(`${shape.type}#${shape.id}  parent=svg`);
        console.log(shape.getDetails().map((detail) => `  ${detail}`).join("\n"));
      }
    }
  } else if (command === "canvas") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length === 0) {
      console.log(`canvas ${document.width}x${document.height}`);
    } else if (args.length === 2) {
      try {
        document.setSize(Number(args[0]), Number(args[1]));
        console.log(`canvas resized to ${document.width}x${document.height}`);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    } else {
      console.log("error: usage: canvas [width] [height]");
    }
  } else if (command === "exit") {
    terminal.close();
    return;
  } else if (command !== "") {
    console.log(`error: unknown command: ${command}`);
  }

  terminal.prompt();
});