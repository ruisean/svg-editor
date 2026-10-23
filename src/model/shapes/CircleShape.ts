import { Shape } from "../Shape.js";

export class CircleShape extends Shape {
  private _cx: number;
  private _cy: number;
  private _r: number;
  private _fill?: string;
  private _stroke?: string;
  private _strokeWidth?: number;

  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id);

    if (![cx, cy, r].every(Number.isFinite)) {
      throw new Error("circle coordinates and radius must be numbers");
    }
    if (r <= 0) {
      throw new Error("circle radius must be positive");
    }

    this._cx = cx;
    this._cy = cy;
    this._r = r;
    this._fill = fill;
  }

  get type(): string {
    return "circle";
  }

  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
      throw new Error("move distance must be numbers");
    }

    this._cx += dx;
    this._cy += dy;
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new Error("scale factor must be positive");
    }

    this._cx *= factor;
    this._cy *= factor;
    this._r *= factor;
  }

  getAttribute(name: string): string | undefined {
    if (name === "cx") return String(this._cx);
    if (name === "cy") return String(this._cy);
    if (name === "r") return String(this._r);
    if (name === "fill") return this._fill;
    if (name === "stroke") return this._stroke;
    if (name === "stroke-width") {
      return this._strokeWidth === undefined ? undefined : String(this._strokeWidth);
    }
    return undefined;
  }

  setAttribute(name: string, value: string | undefined): void {
    if (name === "fill") {
      this._fill = value;
      return;
    }
    if (name === "stroke") {
      this._stroke = value;
      return;
    }
    if (name === "stroke-width" && value === undefined) {
      this._strokeWidth = undefined;
      return;
    }
    if (!["cx", "cy", "r", "stroke-width"].includes(name)) {
      throw new Error(`unknown attribute: ${name}`);
    }

    const number = value === undefined ? NaN : Number(value);
    if (!Number.isFinite(number)) {
      throw new Error(`invalid value for ${name}`);
    }

    if (name === "cx") this._cx = number;
    else if (name === "cy") this._cy = number;
    else if (name === "r" && number > 0) this._r = number;
    else if (name === "stroke-width" && number >= 0) this._strokeWidth = number;
    else if (name === "r") throw new Error("r must be positive");
    else if (name === "stroke-width") throw new Error("stroke-width must be non-negative");
    else throw new Error(`unknown attribute: ${name}`);
  }

  getDetails(): string[] {
    const details = [`cx=${this._cx}`, `cy=${this._cy}`, `r=${this._r}`];

    if (this._fill !== undefined) details.push(`fill=${this._fill}`);
    if (this._stroke !== undefined) details.push(`stroke=${this._stroke}`);
    if (this._strokeWidth !== undefined) {
      details.push(`stroke-width=${this._strokeWidth}`);
    }

    return details;
  }

  toSvg(): string {
    const attributes = [
      this._fill === undefined ? "" : ` fill="${this.escapeXml(this._fill)}"`,
      this._stroke === undefined ? "" : ` stroke="${this.escapeXml(this._stroke)}"`,
      this._strokeWidth === undefined
        ? ""
        : ` stroke-width="${this._strokeWidth}"`,
    ].join("");

    return `<circle id="${this.escapeXml(this.id)}" cx="${this._cx}" cy="${this._cy}" r="${this._r}"${attributes}/>`;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
