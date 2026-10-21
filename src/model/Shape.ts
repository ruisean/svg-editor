import type { GroupShape } from "./shapes/GroupShape.js";

export abstract class Shape {
  private _parent: GroupShape | null = null;

  constructor(private readonly _id: string) {
    if (_id.trim() === "") {
      throw new Error("shape id cannot be empty");
    }
  }

  get id(): string {
    return this._id;
  }

  get parent(): GroupShape | null {
    return this._parent;
  }

  setParent(parent: GroupShape | null): void {
    this._parent = parent;
  }

  abstract get type(): string;

  abstract toSvg(): string;

  abstract getDetails(): string[];

  abstract move(dx: number, dy: number): void;

  abstract scale(factor: number): void;

  getAttribute(_name: string): string | undefined {
  return undefined;
  }

  setAttribute(name: string, _value: string | undefined): void {
  throw new Error(`unknown attribute: ${name}`);
  }

  getTreeLines(prefix = "", isLast = true): string[] {
    const branch = isLast ? "└──" : "├──";
    return [`${prefix}${branch} ${this.type}#${this.id}  ${this.getDetails().join(" ")}`];
  }
}
