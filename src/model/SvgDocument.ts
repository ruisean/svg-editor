export class SvgDocument {
  private _width: number;
  private _height: number;

  constructor(width = 800, height = 600) {
    if (!Number.isFinite(width) || width <= 0) {
      throw new Error("width must be a positive number");
    }

    if (!Number.isFinite(height) || height <= 0) {
      throw new Error("height must be a positive number");
    }

    this._width = width;
    this._height = height;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }
  setSize(width: number, height: number): void {
    if (!Number.isFinite(width) || width <= 0) {
      throw new Error("width must be a positive number");
    }

    if (!Number.isFinite(height) || height <= 0) {
      throw new Error("height must be a positive number");
    }

    this._width = width;
    this._height = height;
  }
}