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

  createFromSvg(
    type: string,
    attributes: Record<string, string>,
    textContent = "",
  ): Shape {
    const id = attributes.id;
    if (id === undefined || id.trim() === "") {
      throw new Error(`missing id on <${type}>`);
    }

    const builders: Record<string, () => string[]> = {
      rect: () => {
        const args = [
          id,
          svgNumber(attributes, "x", "0"),
          svgNumber(attributes, "y", "0"),
          svgNumber(attributes, "width"),
          svgNumber(attributes, "height"),
        ];
        if (attributes.fill !== undefined) args.push(attributes.fill);
        return args;
      },
      circle: () => {
        const args = [
          id,
          svgNumber(attributes, "cx", "0"),
          svgNumber(attributes, "cy", "0"),
          svgNumber(attributes, "r"),
        ];
        if (attributes.fill !== undefined) args.push(attributes.fill);
        return args;
      },
      ellipse: () => {
        const args = [
          id,
          svgNumber(attributes, "cx", "0"),
          svgNumber(attributes, "cy", "0"),
          svgNumber(attributes, "rx"),
          svgNumber(attributes, "ry"),
        ];
        if (attributes.fill !== undefined) args.push(attributes.fill);
        return args;
      },
      line: () => {
        const args = [
          id,
          svgNumber(attributes, "x1", "0"),
          svgNumber(attributes, "y1", "0"),
          svgNumber(attributes, "x2", "0"),
          svgNumber(attributes, "y2", "0"),
        ];
        if (attributes.stroke !== undefined) args.push(attributes.stroke);
        return args;
      },
      text: () => [
        id,
        svgNumber(attributes, "x", "0"),
        svgNumber(attributes, "y", "0"),
        textContent,
      ],
      g: () => [id],
    };

    const buildArgs = builders[type];
    if (buildArgs === undefined) {
      throw new Error(`unsupported SVG element: <${type}>`);
    }

    const shape = this.create(type, buildArgs());
    if (!(shape instanceof GroupShape)) {
      if (type !== "line" && attributes.fill !== undefined) {
        shape.setAttribute("fill", attributes.fill);
      }
      if (attributes.stroke !== undefined) {
        shape.setAttribute("stroke", attributes.stroke);
      }
      if (attributes["stroke-width"] !== undefined) {
        shape.setAttribute("stroke-width", attributes["stroke-width"]);
      }
    }
    return shape;
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

function svgNumber(
  attributes: Record<string, string>,
  name: string,
  fallback?: string,
): string {
  const rawValue = attributes[name] ?? fallback;
  if (rawValue === undefined) throw new Error(`missing ${name} in SVG`);
  const match = rawValue.trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:px)?$/i);
  if (match === null) throw new Error(`invalid SVG ${name}: ${rawValue}`);
  const value = Number(match[1]);
  if (!Number.isFinite(value)) throw new Error(`invalid SVG ${name}: ${rawValue}`);
  return String(value);
}
