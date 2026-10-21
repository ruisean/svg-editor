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
    shape.setParent(this);
  }

  insertChildAt(index: number, shape: Shape): void {
    if (!Number.isInteger(index) || index < 0 || index > this._children.length) {
      throw new Error("invalid child index");
    }
    this._children.splice(index, 0, shape);
    shape.setParent(this);
  }

  removeChild(id: string): Shape | undefined {
    const index = this._children.findIndex((shape) => shape.id === id);

    if (index === -1) {
      return undefined;
    }

    const [shape] = this._children.splice(index, 1);
    shape?.setParent(null);
    return shape;
  }

  childIndex(id: string): number {
    const index = this._children.findIndex((shape) => shape.id === id);
    if (index === -1) throw new Error(`no such child: ${id}`);
    return index;
  }

  contains(id: string): boolean {
    return this._children.some(
      (child) =>
        child.id === id ||
        (child instanceof GroupShape && child.contains(id)),
    );
  }

  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      throw new Error("move distance must be numbers");
    }

    for (const child of this._children) {
      child.move(dx, dy);
    }
  }
  
  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new Error("scale factor must be positive");
    }

    for (const child of this._children) {
      child.scale(factor);
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
