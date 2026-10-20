import { Command } from "./Command.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { Shape } from "../model/Shape.js";
import { ShapeLocation } from "../model/SvgDocument.js";

export class DeleteShapeCommand implements Command {
  private previousLocation: ShapeLocation | null = null;
  constructor(
    private readonly document: SvgDocument,
    private readonly shape: Shape,
  ) {}

  execute(): string {
    this.previousLocation = this.document.getLocation(this.shape.id);
    this.document.removeShape(this.shape.id);
    return `${this.shape.type}#${this.shape.id} deleted`;
  }

  undo(): string {
    if (this.previousLocation === null) throw new Error("cannot undo delete");
    this.document.restoreDeleted(this.shape, this.previousLocation);
    return `${this.shape.type}#${this.shape.id} restored`;
  }
}
