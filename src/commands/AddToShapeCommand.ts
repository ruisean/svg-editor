import { Command } from "./Command.js";
import { SvgDocument, ShapeLocation } from "../model/SvgDocument.js";

export class AddToShapeCommand implements Command {
  private previousLocation: ShapeLocation | null = null;

  constructor(
    private readonly document: SvgDocument,
    private readonly containerId: string,
    private readonly shapeId: string,
  ) {}

  execute(): string {
    this.previousLocation = this.document.addTo(this.containerId, this.shapeId);
    return `${this.shapeId} added to g#${this.containerId}`;
  }

  undo(): string {
    if (this.previousLocation === null) throw new Error("cannot undo addto");
    this.document.restoreLocation(this.shapeId, this.previousLocation);
    return `${this.shapeId} restored to its previous parent`;
  }
}
