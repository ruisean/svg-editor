import { Shape } from "../Shape.js";

export class TextShape extends Shape {
  private _x: number;
  private _y: number;
  private _text: string;
  private _fill?: string;
  private _stroke?: string;
  private _strokeWidth?: number;

  constructor(id: string, x: number, y: number, text: string) {
    super(id);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("text coordinates must be numbers");
    }

    this._x = x;
    this._y = y;
    this._text = text;
  }

  get type(): string {
    return "text";
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
  }

  getAttribute(name: string): string | undefined {
    if (name === "x") return String(this._x);
    if (name === "y") return String(this._y);
    if (name === "text") return this._text;
    if (name === "fill") return this._fill;
    if (name === "stroke") return this._stroke;
    if (name === "stroke-width") {
      return this._strokeWidth === undefined ? undefined : String(this._strokeWidth);
    }
    return undefined;
  }

  setAttribute(name: string, value: string | undefined): void {
    if (name === "text") {
      this._text = value ?? "";
      return;
    }
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
    if (!["x", "y", "stroke-width"].includes(name)) {
      throw new Error(`unknown attribute: ${name}`);
    }

    const number = value === undefined ? NaN : Number(value);
    if (!Number.isFinite(number)) {
      throw new Error(`invalid value for ${name}`);
    }

    if (name === "x") this._x = number;
    else if (name === "y") this._y = number;
    else if (name === "stroke-width" && number >= 0) this._strokeWidth = number;
    else if (name === "stroke-width") {
      throw new Error("stroke-width must be non-negative");
    } else {
      throw new Error(`unknown attribute: ${name}`);
    }
  }

  getDetails(): string[] {
    const details = [`x=${this._x}`, `y=${this._y}`, `text=${this._text}`];

    if (this._fill !== undefined) details.push(`fill=${this._fill}`);
    if (this._stroke !== undefined) details.push(`stroke=${this._stroke}`);
    if (this._strokeWidth !== undefined) {
      details.push(`stroke-width=${this._strokeWidth}`);
    }

    return details;
  }

  getTreeLines(prefix = "", isLast = true): string[] {
    const branch = isLast ? "└──" : "├──";
    const content = this._text.replaceAll('"', '\\"');
    return [`${prefix}${branch} text#${this.id} (${this._x},${this._y}) "${content}"`];
  }

  toSvg(): string {
    const attributes = [
      this._fill === undefined ? "" : ` fill="${this.escapeXml(this._fill)}"`,
      this._stroke === undefined ? "" : ` stroke="${this.escapeXml(this._stroke)}"`,
      this._strokeWidth === undefined
        ? ""
        : ` stroke-width="${this._strokeWidth}"`,
    ].join("");

    return `<text id="${this.escapeXml(this.id)}" x="${this._x}" y="${this._y}"${attributes}>${this.escapeXml(this._text)}</text>`;
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
