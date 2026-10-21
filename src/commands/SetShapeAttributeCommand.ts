import { Command } from "./Command.js";
import { Shape } from "../model/Shape.js";

export class SetShapeAttributeCommand implements Command {
  private previousValue: string | undefined;
  private capturedPreviousValue = false;

  constructor(
    private readonly shape: Shape,
    private readonly attribute: string,
    private readonly value: string,
  ) {}

  execute(): string {
    if (!this.capturedPreviousValue) {
      this.previousValue = this.shape.getAttribute(this.attribute);
      this.capturedPreviousValue = true;
    }

    this.shape.setAttribute(this.attribute, this.value);
    return `${this.shape.type}#${this.shape.id} updated: ${this.attribute}=${this.value}`;
  }

  undo(): string {
    this.shape.setAttribute(this.attribute, this.previousValue);
    const restoredValue = this.previousValue ?? "(default)";
    return `${this.shape.type}#${this.shape.id} updated: ${this.attribute}=${restoredValue}`;
  }
}