import * as readline from "node:readline";
import { SvgDocument } from "./model/SvgDocument.js";
import { RectShape } from "./model/shapes/RectShape.js";
import { CommandHistory } from "./commands/CommandHistory.js";
import { MoveShapeCommand } from "./commands/MoveShapeCommand.js";
import { DeleteShapeCommand } from "./commands/DeleteShapeCommand.js";
import { CreateShapeCommand } from "./commands/CreateShapeCommand.js";
import { GroupShape } from "./model/shapes/GroupShape.js";
import { AddToShapeCommand } from "./commands/AddToShapeCommand.js";
import { GroupShapesCommand } from "./commands/GroupShapesCommand.js";

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let document: SvgDocument | null = null;
const history = new CommandHistory();

console.log("svg-editor 0.1 — type 'help' for commands");

terminal.setPrompt("svg> ");
terminal.prompt();

terminal.on("line", (input) => {
  const parts = input.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  if (command === "help") {
    console.log(`Commands:
        init [width] [height]
        canvas [width] [height]
        create rect <id> <x> <y> <width> <height> [fill]
        create g <id>
        show <id>
        tree [id]
        addto <gid> <id>
        move <id> <dx> <dy>
        undo
        redo
        delete <id>
        group <newGid> <id1> <id2>...
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
        history.reset();
        console.log(`canvas ${document.width}x${document.height} created`);
      } catch (error) {
        console.log(`error: ${(error as Error).message}`);
      }
    }
  } else if (command === "create") {
    if (document === null) {
      console.log("error: no document. use 'init' or 'read' first");
    } else if (args[0] === "g") {
      if (args.length !== 2) {
        console.log("error: usage: create g <id>");
      } else {
        try {
          const group = new GroupShape(args[1]);
          console.log(history.execute(new CreateShapeCommand(document, group)));
        } catch (error) {
          console.log(`error: ${(error as Error).message}`);
        }
      }
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
        console.log(history.execute(new CreateShapeCommand(document, shape)));
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
  } else if (command === "exit") {
    terminal.close();
    return;
  } else if (command !== "") {
    console.log(`error: unknown command: ${command}`);
  }

  terminal.prompt();
});
