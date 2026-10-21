import { Command } from "./Command.js";
import { Shape } from "../model/Shape.js";

export class ScaleShapeCommand implements Command {
  constructor(
    private readonly shape: Shape,
    private readonly factor: number,
  ) {}

  execute(): string {
    this.shape.scale(this.factor);
    return `${this.shape.type}#${this.shape.id} scaled by ${this.factor}`;
  }

  undo(): string {
    const inverseFactor = 1 / this.factor;
    this.shape.scale(inverseFactor);
    return `${this.shape.type}#${this.shape.id} scale undone`;
  }
}