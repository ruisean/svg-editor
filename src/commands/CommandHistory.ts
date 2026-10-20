import { Command } from "./Command.js";

export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private undoBlocked = false;

  execute(command: Command): string {
    const message = command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.undoBlocked = false;
    return message;
  }

  undo(): string {
    if (this.undoBlocked) {
      throw new Error("undo not allowed after io command");
    }

    const command = this.undoStack.pop();

    if (command === undefined) {
      throw new Error("nothing to undo");
    }

    const message = command.undo();
    this.redoStack.push(command);
    return message;
  }

  redo(): string {
    if (this.undoBlocked) {
      throw new Error("redo not allowed after io command");
    }

    const command = this.redoStack.pop();

    if (command === undefined) {
      throw new Error("nothing to redo");
    }

    const message = command.execute();
    this.undoStack.push(command);
    return message;
  }

  markIoOperation(): void {
    this.undoBlocked = true;
  }

  reset(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.undoBlocked = true;
  }
}