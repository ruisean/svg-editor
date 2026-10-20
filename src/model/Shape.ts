export abstract class Shape {
  constructor(private readonly _id: string) {
    if (_id.trim() === "") {
      throw new Error("shape id cannot be empty");
    }
  }

  get id(): string {
    return this._id;
  }

  abstract get type(): string;

  abstract toSvg(): string;
}