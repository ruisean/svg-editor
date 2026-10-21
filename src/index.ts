import * as readline from "node:readline";
import { readFileSync, writeFileSync } from "node:fs";
import { SvgDocument } from "./model/SvgDocument.js";
import { CommandHistory } from "./commands/CommandHistory.js";
import { MoveShapeCommand } from "./commands/MoveShapeCommand.js";
import { DeleteShapeCommand } from "./commands/DeleteShapeCommand.js";
import { CreateShapeCommand } from "./commands/CreateShapeCommand.js";
import { ShapeFactory } from "./model/ShapeFactory.js";
import { AddToShapeCommand } from "./commands/AddToShapeCommand.js";
import { GroupShapesCommand } from "./commands/GroupShapesCommand.js";
import { UngroupShapesCommand } from "./commands/UngroupShapesCommand.js";
import { ScaleShapeCommand } from "./commands/ScaleShapeCommand.js";
import { SetShapeAttributeCommand } from "./commands/SetShapeAttributeCommand.js";
import { ReorderShapeCommand } from "./commands/ReorderShapeCommand.js";
import { SvgReader } from "./model/SvgReader.js";

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let document: SvgDocument | null = null;
let currentFilePath: string | null = null;
const history = new CommandHistory();
const shapeFactory = new ShapeFactory();

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  let tokenStarted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character === "\\" && inQuotes && index + 1 < input.length) {
      const nextCharacter = input[index + 1];
      if (nextCharacter === '"' || nextCharacter === "\\") {
        current += nextCharacter;
        index += 1;
        tokenStarted = true;
        continue;
      }
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      tokenStarted = true;
    } else if (/\s/.test(character) && !inQuotes) {
      if (tokenStarted) {
        tokens.push(current);
        current = "";
        tokenStarted = false;
      }
    } else {
      current += character;
      tokenStarted = true;
    }
  }

  if (inQuotes) {
    throw new Error("unterminated quoted argument");
  }
  if (tokenStarted) tokens.push(current);

  return tokens;
}

console.log("svg-editor 0.1 — type 'help' for commands");

terminal.setPrompt("svg> ");
terminal.prompt();

terminal.on("line", (input) => {
  let parts: string[];
  try {
    parts = tokenize(input);
  } catch (error) {
    console.log(`error: ${(error as Error).message}`);
    terminal.prompt();
    return;
  }
  const command = parts[0];
  const args = parts.slice(1);

  if (command === "help") {
    console.log(`Commands:
        init [width] [height]
        read <file.svg>
        save [file.svg]
        canvas [width] [height]
        create rect <id> <x> <y> <width> <height> [fill] [in <containerId>]
        create circle <id> <cx> <cy> <r> [fill] [in <containerId>]
        create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]
        create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]
        create text <id> <x> <y> "content" [in <containerId>]
        create g <id> [in <containerId>]
        show <id>
        tree [id]
        addto <gid> <id>
        move <id> <dx> <dy>
        undo
        redo
        delete <id>
        group <newGid> <id1> <id2>...
        ungroup <gid>
        scale <id> <factor>
        set <id> <attr> <value>
        front <id>
        back <id>
        help
        exit`);
  } else if (command === "init") {
    if (args.length !== 0 && args.length !== 2) {
      console.log("error: usage: init [width] [height]");
    } else {
      const width = args.length === 2 ? Number(args[0]) : 800;
      const height = args.length === 2 ? Number(args[1]) : 600;

      try {
        const newDocument = new SvgDocument(width, height);
        document = newDocument;
        currentFilePath = null;
        history.reset();
        console.log(`canvas ${document.width}x${document.height} created`);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "create") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length === 0) {
      console.log("error: usage: create <type> <id> [params...]");
    } else {
      try {
        const type = args[0];
        const shapeArgs = args.slice(1);
        let containerId: string | undefined;

        if (shapeArgs.length >= 2 && shapeArgs[shapeArgs.length - 2] === "in") {
          containerId = shapeArgs[shapeArgs.length - 1];
          shapeArgs.splice(-2);
          if (containerId === "") {
            throw new Error("usage: create <type> <id> [params...] in <containerId>");
          }
        }

        const shape = shapeFactory.create(type, shapeArgs);
        console.log(
          history.execute(new CreateShapeCommand(document, shape, containerId)),
        );
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "delete") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 1) {
      console.log("error: usage: delete <id>");
    } else {
      const shape = document.getShape(args[0]);

      if (shape === undefined) {
        console.log(`error: no such shape: ${args[0]}`);
      } else {
        try {
          const message = history.execute(
            new DeleteShapeCommand(document, shape),
          );
          console.log(message);
        } catch (error) {
          console.log(`error: ${(error as Error).message}`);
        }
      }
    }
  } else if (command === "ungroup") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 1) {
      console.log("error: usage: ungroup <gid>");
    } else {
      try {
        const message = history.execute(
          new UngroupShapesCommand(document, args[0]),
        );
        console.log(message);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "group") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length < 3) {
      console.log("error: usage: group <newGid> <id1> <id2>...");
    } else {
      try {
        const message = history.execute(
          new GroupShapesCommand(document, args[0], args.slice(1)),
        );
        console.log(message);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "addto") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 2) {
      console.log("error: usage: addto <gid> <id>");
    } else {
      try {
        const message = history.execute(
          new AddToShapeCommand(document, args[0], args[1]),
        );
        console.log(message);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "set") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 3) {
      console.log("error: usage: set <id> <attr> <value>");
    } else {
      const shape = document.getShape(args[0]);

      if (shape === undefined) {
        console.log(`error: no such shape: ${args[0]}`);
      } else {
        try {
          const message = history.execute(
            new SetShapeAttributeCommand(shape, args[1], args[2]),
          );
          console.log(message);
        } catch (error) {
          console.log(`error: ${(error as Error).message}`);
        }
      }
    }
  } else if (command === "front" || command === "back") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 1) {
      console.log(`error: usage: ${command} <id>`);
    } else {
      try {
        const message = history.execute(
          new ReorderShapeCommand(document, args[0], command),
        );
        console.log(message);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "scale") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 2) {
      console.log("error: usage: scale <id> <factor>");
    } else {
      const shape = document.getShape(args[0]);

      if (shape === undefined) {
        console.log(`error: no such shape: ${args[0]}`);
      } else {
        try {
          const message = history.execute(
            new ScaleShapeCommand(shape, Number(args[1])),
          );
          console.log(message);
        } catch (error) {
          console.log(`error: ${(error as Error).message}`);
        }
      }
    }
  } else if (command === "move") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length !== 3) {
      console.log("error: usage: move <id> <dx> <dy>");
    } else {
      const shape = document.getShape(args[0]);

      if (shape === undefined) {
        console.log(`error: no such shape: ${args[0]}`);
      } else {
        try {
          const message = history.execute(
            new MoveShapeCommand(shape, Number(args[1]), Number(args[2])),
          );
          console.log(message);
        } catch (error) {
          console.log(`error: ${(error as Error).message}`);
        }
      }
    }
  } else if (command === "undo" || command === "redo") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else {
      try {
        const message = command === "undo" ? history.undo() : history.redo();
        console.log(message);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "tree") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length > 1) {
      console.log("error: usage: tree [id]");
    } else if (args.length === 1) {
      const shape = document.getShape(args[0]);

      if (shape === undefined) {
        console.log(`error: no such shape: ${args[0]}`);
      } else {
        console.log(shape.getTreeLines("", true).join("\n"));
      }
    } else {
      console.log(`svg (${document.width}x${document.height})`);
      const shapes = document.getShapes();

      shapes.forEach((shape, index) => {
        console.log(shape.getTreeLines("", index === shapes.length - 1).join("\n"));
      });
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
        console.log(`${shape.type}#${shape.id}  parent=${shape.parent === null ? "svg" : `g#${shape.parent.id}`}`);
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
        history.markIoOperation();
        console.log(`canvas resized to ${document.width}x${document.height}`);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    } else {
      console.log("error: usage: canvas [width] [height]");
    }
  } else if (command === "save") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args.length > 1) {
      console.log("error: usage: save [file.svg]");
    } else {
      const filePath = args[0] ?? currentFilePath;
      if (filePath === null || filePath === undefined) {
        console.log("error: specify a file path with 'save <file.svg>'");
      } else {
        try {
          writeFileSync(filePath, document.toSvg(), "utf8");
          currentFilePath = filePath;
          history.markIoOperation();
          console.log(`saved ${filePath}`);
        } catch (error) {
          console.log(`error: ${(error as Error).message}`);
        }
      }
    }
  } else if (command === "read") {
    if (args.length !== 1) {
      console.log("error: usage: read <file.svg>");
    } else {
      try {
        const source = readFileSync(args[0], "utf8");
        const result = SvgReader.parse(source);
        document = result.document;
        currentFilePath = args[0];
        history.reset();
        for (const warning of result.warnings) console.log(warning);
        console.log(`read ${args[0]} (${document.width}x${document.height})`);
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
