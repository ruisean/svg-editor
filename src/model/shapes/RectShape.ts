import { Shape } from "../Shape.js";

export class RectShape extends Shape {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;
  private _fill?: string;

  constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill?: string,
  ) {
    super(id);

    if (![x, y, width, height].every(Number.isFinite)) {
      throw new Error("rectangle coordinates and size must be numbers");
    }
    if (width <= 0 || height <= 0) {
      throw new Error("rectangle width and height must be positive");
    }

    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._fill = fill;
  }

  get type(): string {
    return "rect";
  }

  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      throw new Error("move distance must be numbers");
    }

    this._x += dx;
    this._y += dy;
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new Error("scale factor must be positive");
    }

    this._x *= factor;
    this._y *= factor;
    this._width *= factor;
    this._height *= factor;
  }

  getDetails(): string[] {
  const details = [
    `x=${this._x}`,
    `y=${this._y}`,
    `width=${this._width}`,
    `height=${this._height}`,
  ];

  if (this._fill !== undefined) {
    details.push(`fill=${this._fill}`);
  }

  return details;
  }

  toSvg(): string {
    const fill = this._fill === undefined
      ? ""
      : ` fill="${this.escapeXml(this._fill)}"`;

    return `<rect id="${this.escapeXml(this.id)}" x="${this._x}" y="${this._y}" width="${this._width}" height="${this._height}"${fill}/>`;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}