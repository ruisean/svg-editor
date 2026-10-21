import { Command } from "./Command.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { Shape } from "../model/Shape.js";

export class CreateShapeCommand implements Command {
  constructor(
    private readonly document: SvgDocument,
    private readonly shape: Shape,
    private readonly containerId?: string,
  ) {}

  execute(): string {
    this.document.addShape(this.shape);
    if (this.containerId !== undefined) {
      try {
        this.document.addTo(this.containerId, this.shape.id);
      } catch (error) {
        this.document.removeShape(this.shape.id);
        throw error;
      }
      return `${this.shape.type}#${this.shape.id} created in g#${this.containerId}`;
    }
    return `${this.shape.type}#${this.shape.id} created`;
  }

  undo(): string {
    this.document.removeShape(this.shape.id);
    return `${this.shape.type}#${this.shape.id} creation undone`;
  }
}
