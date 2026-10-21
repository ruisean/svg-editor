import { Shape } from "./Shape.js";
import { RectShape } from "./shapes/RectShape.js";
import { CircleShape } from "./shapes/CircleShape.js";
import { GroupShape } from "./shapes/GroupShape.js";

export class ShapeFactory {
  create(type: string, args: string[]): Shape {
    switch (type) {
      case "rect":
        return this.createRect(args);
      case "circle":
        return this.createCircle(args);
      case "g":
        return this.createGroup(args);
      default:
        throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }

  private createRect(args: string[]): RectShape {
    if (args.length !== 5 && args.length !== 6) {
      throw new Error("usage: create rect <id> <x> <y> <width> <height> [fill]");
    }

    return new RectShape(
      args[0],
      Number(args[1]),
      Number(args[2]),
      Number(args[3]),
      Number(args[4]),
      args[5],
    );
  }

  private createCircle(args: string[]): CircleShape {
    if (args.length !== 4 && args.length !== 5) {
      throw new Error("usage: create circle <id> <cx> <cy> <r> [fill]");
    }

    return new CircleShape(
      args[0],
      Number(args[1]),
      Number(args[2]),
      Number(args[3]),
      args[4],
    );
  }

  private createGroup(args: string[]): GroupShape {
    if (args.length !== 1) {
      throw new Error("usage: create g <id>");
    }
    return new GroupShape(args[0]);
  }
}
