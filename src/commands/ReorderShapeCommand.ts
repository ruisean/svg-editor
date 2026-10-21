import { Command } from "./Command.js";
import { SvgDocument, ShapeLocation } from "../model/SvgDocument.js";

export class ReorderShapeCommand implements Command {
  private previousLocation: ShapeLocation | null = null;

  constructor(
    private readonly document: SvgDocument,
    private readonly shapeId: string,
    private readonly direction: "front" | "back",
  ) {}

  execute(): string {
    const shape = this.document.getShape(this.shapeId);
    if (shape === undefined) throw new Error(`no such shape: ${this.shapeId}`);

    if (this.previousLocation === null) {
      this.previousLocation = this.document.getLocation(this.shapeId);
    }

    if (this.direction === "front") {
      this.document.moveToFront(this.shapeId);
    } else {
      this.document.moveToBack(this.shapeId);
    }

    return `${shape.type}#${shape.id} moved to ${this.direction}`;
  }

  undo(): string {
    if (this.previousLocation === null) {
      throw new Error("cannot undo reorder");
    }

    this.document.restoreLocation(this.shapeId, this.previousLocation);
    return `${this.shapeId} order restored`;
  }
}
