import { Shape } from "../Shape.js";

export class GroupShape extends Shape {
  private readonly _children: Shape[] = [];

  get type(): string {
    return "g";
  }

  get children(): Shape[] {
    return [...this._children];
  }

  addChild(shape: Shape): void {
    this._children.push(shape);
  }

  removeChild(id: string): Shape | undefined {
    const index = this._children.findIndex((shape) => shape.id === id);

    if (index === -1) {
      return undefined;
    }

    return this._children.splice(index, 1)[0];
  }

  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      throw new Error("move distance must be numbers");
    }

    for (const child of this._children) {
      child.move(dx, dy);
    }
  }

  getDetails(): string[] {
    return [`children=${this._children.length}`];
  }

  toSvg(): string {
    const children = this._children.map((child) => child.toSvg()).join("\n");
    return `<g id="${this.escapeXml(this.id)}">\n${children}\n</g>`;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}