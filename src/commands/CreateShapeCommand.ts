import { Command } from "./Command.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { Shape } from "../model/Shape.js";

export class CreateShapeCommand implements Command {
  constructor(
    private readonly document: SvgDocument,
    private readonly shape: Shape,
  ) {}

  execute(): string {
    this.document.addShape(this.shape);
    return `${this.shape.type}#${this.shape.id} created`;
  }

  undo(): string {
    this.document.removeShape(this.shape.id);
    return `${this.shape.type}#${this.shape.id} creation undone`;
  }
}