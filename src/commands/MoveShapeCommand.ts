import { Command } from "./Command.js";
import { Shape } from "../model/Shape.js";

export class MoveShapeCommand implements Command {
  constructor(
    private readonly shape: Shape,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  execute(): string {
    this.shape.move(this.dx, this.dy);
    return `${this.shape.type}#${this.shape.id} moved by (${this.dx},${this.dy})`;
  }

  undo(): string {
    this.shape.move(-this.dx, -this.dy);
    return `${this.shape.type}#${this.shape.id} moved back by (${-this.dx},${-this.dy})`;
  }
}