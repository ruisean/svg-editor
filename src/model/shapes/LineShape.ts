import { Shape } from "../Shape.js";

export class LineShape extends Shape {
  private _x1: number;
  private _y1: number;
  private _x2: number;
  private _y2: number;
  private _stroke?: string;
  private _strokeWidth?: number;

  constructor(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke?: string,
  ) {
    super(id);

    if (![x1, y1, x2, y2].every(Number.isFinite)) {
      throw new Error("line coordinates must be numbers");
    }

    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
    this._stroke = stroke;
  }

  get type(): string {
    return "line";
  }

  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      throw new Error("move distance must be numbers");
    }

    this._x1 += dx;
    this._y1 += dy;
    this._x2 += dx;
    this._y2 += dy;
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new Error("scale factor must be positive");
    }

    this._x1 *= factor;
    this._y1 *= factor;
    this._x2 *= factor;
    this._y2 *= factor;
  }

  getAttribute(name: string): string | undefined {
    if (name === "x1") return String(this._x1);
    if (name === "y1") return String(this._y1);
    if (name === "x2") return String(this._x2);
    if (name === "y2") return String(this._y2);
    if (name === "stroke") return this._stroke;
    if (name === "stroke-width") {
      return this._strokeWidth === undefined ? undefined : String(this._strokeWidth);
    }
    return undefined;
  }

  setAttribute(name: string, value: string | undefined): void {
    if (name === "stroke") {
      this._stroke = value;
      return;
    }
    if (name === "stroke-width" && value === undefined) {
      this._strokeWidth = undefined;
      return;
    }

    const number = value === undefined ? NaN : Number(value);
    if (!Number.isFinite(number)) {
      throw new Error(`invalid value for ${name}`);
    }

    if (name === "x1") this._x1 = number;
    else if (name === "y1") this._y1 = number;
    else if (name === "x2") this._x2 = number;
    else if (name === "y2") this._y2 = number;
    else if (name === "stroke-width" && number >= 0) this._strokeWidth = number;
    else if (name === "stroke-width") {
      throw new Error("stroke-width must be non-negative");
    } else {
      throw new Error(`unknown attribute: ${name}`);
    }
  }

  getDetails(): string[] {
    const details = [
      `x1=${this._x1}`,
      `y1=${this._y1}`,
      `x2=${this._x2}`,
      `y2=${this._y2}`,
    ];

    if (this._stroke !== undefined) details.push(`stroke=${this._stroke}`);
    if (this._strokeWidth !== undefined) {
      details.push(`stroke-width=${this._strokeWidth}`);
    }

    return details;
  }

  toSvg(): string {
    const attributes = [
      this._stroke === undefined ? "" : ` stroke="${this.escapeXml(this._stroke)}"`,
      this._strokeWidth === undefined
        ? ""
        : ` stroke-width="${this._strokeWidth}"`,
    ].join("");

    return `<line id="${this.escapeXml(this.id)}" x1="${this._x1}" y1="${this._y1}" x2="${this._x2}" y2="${this._y2}"${attributes}/>`;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
