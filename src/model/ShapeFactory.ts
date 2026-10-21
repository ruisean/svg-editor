import { Shape } from "./Shape.js";
import { RectShape } from "./shapes/RectShape.js";
import { CircleShape } from "./shapes/CircleShape.js";
import { EllipseShape } from "./shapes/EllipseShape.js";
import { LineShape } from "./shapes/LineShape.js";
import { TextShape } from "./shapes/TextShape.js";
import { GroupShape } from "./shapes/GroupShape.js";

export class ShapeFactory {
  create(type: string, args: string[]): Shape {
    switch (type) {
      case "rect":
        return this.createRect(args);
      case "circle":
        return this.createCircle(args);
      case "ellipse":
        return this.createEllipse(args);
      case "line":
        return this.createLine(args);
      case "text":
        return this.createText(args);
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

  private createEllipse(args: string[]): EllipseShape {
    if (args.length !== 5 && args.length !== 6) {
      throw new Error("usage: create ellipse <id> <cx> <cy> <rx> <ry> [fill]");
    }

    return new EllipseShape(
      args[0],
      Number(args[1]),
      Number(args[2]),
      Number(args[3]),
      Number(args[4]),
      args[5],
    );
  }

  private createLine(args: string[]): LineShape {
    if (args.length !== 5 && args.length !== 6) {
      throw new Error("usage: create line <id> <x1> <y1> <x2> <y2> [stroke]");
    }

    return new LineShape(
      args[0],
      Number(args[1]),
      Number(args[2]),
      Number(args[3]),
      Number(args[4]),
      args[5],
    );
  }

  private createText(args: string[]): TextShape {
    if (args.length !== 4) {
      throw new Error('usage: create text <id> <x> <y> "content"');
    }

    return new TextShape(args[0], Number(args[1]), Number(args[2]), args[3]);
  }

  private createGroup(args: string[]): GroupShape {
    if (args.length !== 1) {
      throw new Error("usage: create g <id>");
    }
    return new GroupShape(args[0]);
  }
}
