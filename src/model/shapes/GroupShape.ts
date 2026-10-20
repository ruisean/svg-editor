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
    if (this._children.some((child) => child.id === shape.id)) {
      throw new Error(`id already exists: ${shape.id}`);
    }
    this._children.push(shape);
    shape.setParent(this);
  }

  insertChildAt(index: number, shape: Shape): void {
    if (this._children.some((child) => child.id === shape.id)) {
      throw new Error(`id already exists: ${shape.id}`);
    }
    this._children.splice(index, 0, shape);
    shape.setParent(this);
  }

  childIndex(id: string): number {
    return this._children.findIndex((shape) => shape.id === id);
  }

  contains(id: string): boolean {
    return this._children.some((child) =>
      child.id === id || (child instanceof GroupShape && child.contains(id))
    );
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

  getTreeLines(prefix = "", isLast = true): string[] {
    const branch = isLast ? "└──" : "├──";
    const lines = [`${prefix}${branch} g#${this.id}  ${this.getDetails().join(" ")}`];
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    this._children.forEach((child, index) => {
      lines.push(...child.getTreeLines(childPrefix, index === this._children.length - 1));
    });

    return lines;
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
