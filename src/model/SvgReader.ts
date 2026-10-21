import { GroupShape } from "./shapes/GroupShape.js";
import { ShapeFactory } from "./ShapeFactory.js";
import { SvgDocument } from "./SvgDocument.js";
import { Shape } from "./Shape.js";

type XmlNode = {
  name: string;
  attributes: Record<string, string>;
  children: Array<XmlNode | string>;
};

export type SvgReadResult = {
  document: SvgDocument;
  warnings: string[];
};

export class SvgReader {
  private static readonly shapeFactory = new ShapeFactory();

  static parse(source: string): SvgReadResult {
    const root = parseXml(source);
    if (root.name !== "svg") throw new Error("root element must be <svg>");

    const viewBox = root.attributes.viewBox
      ?.trim()
      .split(/[\s,]+/)
      .map(Number);
    const width = parseLength(
      root.attributes.width,
      "width",
      viewBox?.length === 4 ? viewBox[2] : 800,
    );
    const height = parseLength(
      root.attributes.height,
      "height",
      viewBox?.length === 4 ? viewBox[3] : 600,
    );
    const document = new SvgDocument(width, height);
    const warnings: string[] = [];
    const usedIds = new Set<string>();
    const reservedIds = collectDeclaredIds(root);
    const counters = new Map<string, number>();

    for (const child of root.children) {
      if (typeof child === "string") {
        if (child.trim() !== "") throw new Error("unexpected text outside SVG shapes");
        continue;
      }
      document.addShape(
        this.createShape(
          child,
          usedIds,
          reservedIds,
          counters,
          warnings,
          resolveStyle(root.attributes, {}),
        ),
      );
    }

    return { document, warnings };
  }

  private static createShape(
    node: XmlNode,
    usedIds: Set<string>,
    reservedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
    inheritedStyle: Record<string, string>,
  ): Shape {
    if (node.attributes.transform !== undefined) {
      throw new Error("SVG transform attributes are not supported yet");
    }

    const id = this.getId(node, usedIds, reservedIds, counters, warnings);
    const effectiveStyle = resolveStyle(node.attributes, inheritedStyle);
    const attributes = { ...node.attributes, ...effectiveStyle, id };
    const textContent = node.name === "text" ? this.readText(node) : "";
    const shape = this.shapeFactory.createFromSvg(
      node.name,
      attributes,
      textContent,
    );

    if (shape instanceof GroupShape) {
      for (const child of node.children) {
        if (typeof child === "string") {
          if (child.trim() !== "") throw new Error("unexpected text inside <g>");
          continue;
        }
        shape.addChild(
          this.createShape(
            child,
            usedIds,
            reservedIds,
            counters,
            warnings,
            effectiveStyle,
          ),
        );
      }
    }
    return shape;
  }

  private static readText(node: XmlNode): string {
    if (node.children.some((child) => typeof child !== "string")) {
      throw new Error("nested elements inside <text> are not supported");
    }
    return node.children.join("");
  }

  private static getId(
    node: XmlNode,
    usedIds: Set<string>,
    reservedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): string {
    const declaredId = node.attributes.id?.trim();
    if (declaredId !== undefined && declaredId !== "") {
      if (usedIds.has(declaredId)) throw new Error(`duplicate id: ${declaredId}`);
      usedIds.add(declaredId);
      return declaredId;
    }

    const nextNumber = (counters.get(node.name) ?? 0) + 1;
    counters.set(node.name, nextNumber);
    let generatedId = `${node.name}${nextNumber}`;
    let number = nextNumber;
    while (usedIds.has(generatedId) || reservedIds.has(generatedId)) {
      number += 1;
      generatedId = `${node.name}${number}`;
    }
    counters.set(node.name, number);
    usedIds.add(generatedId);
    warnings.push(`warning: assigned id ${generatedId} to unnamed <${node.name}>`);
    return generatedId;
  }
}

function collectDeclaredIds(root: XmlNode): Set<string> {
  const result = new Set<string>();
  const visit = (node: XmlNode): void => {
    const id = node.attributes.id?.trim();
    if (id !== undefined && id !== "") result.add(id);
    for (const child of node.children) {
      if (typeof child !== "string") visit(child);
    }
  };
  visit(root);
  return result;
}

function parseLength(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined) return fallback;
  const match = value.trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:px)?$/i);
  if (match === null) throw new Error(`unsupported SVG ${name}: ${value}`);
  const result = Number(match[1]);
  if (!Number.isFinite(result)) throw new Error(`invalid SVG ${name}`);
  return result;
}

function resolveStyle(
  attributes: Record<string, string>,
  inherited: Record<string, string>,
): Record<string, string> {
  const result = { ...inherited };
  for (const name of ["fill", "stroke", "stroke-width"]) {
    if (attributes[name] !== undefined) result[name] = attributes[name];
  }
  Object.assign(result, parseStyle(attributes.style));
  return result;
}

function parseStyle(style: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (style === undefined) return result;
  for (const declaration of style.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const name = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (name !== "") result[name] = value;
  }
  return result;
}

function parseXml(source: string): XmlNode {
  const documentNode: XmlNode = { name: "#document", attributes: {}, children: [] };
  const stack = [documentNode];
  let position = 0;

  while (position < source.length) {
    const current = stack[stack.length - 1];
    if (source.startsWith("<!--", position)) {
      const end = source.indexOf("-->", position + 4);
      if (end === -1) throw new Error("unterminated XML comment");
      position = end + 3;
      continue;
    }
    if (source.startsWith("<![CDATA[", position)) {
      const end = source.indexOf("]]>", position + 9);
      if (end === -1) throw new Error("unterminated CDATA section");
      current.children.push(source.slice(position + 9, end));
      position = end + 3;
      continue;
    }
    if (source.startsWith("<?", position)) {
      const end = source.indexOf("?>", position + 2);
      if (end === -1) throw new Error("unterminated XML declaration");
      position = end + 2;
      continue;
    }
    if (source.slice(position, position + 9).toUpperCase() === "<!DOCTYPE") {
      throw new Error("DOCTYPE declarations are not supported");
    }

    if (source[position] !== "<") {
      const end = source.indexOf("<", position);
      const text = source.slice(position, end === -1 ? source.length : end);
      current.children.push(decodeEntities(text));
      position = end === -1 ? source.length : end;
      continue;
    }

    let end = position + 1;
    let quote: string | null = null;
    while (end < source.length) {
      const character = source[end];
      if (quote !== null) {
        if (character === quote) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ">") {
        break;
      }
      end += 1;
    }
    if (end >= source.length) throw new Error("unterminated XML tag");

    const token = source.slice(position + 1, end).trim();
    position = end + 1;
    if (token.startsWith("/")) {
      const closingName = token.slice(1).trim();
      if (stack.length === 1 || stack[stack.length - 1].name !== closingName) {
        throw new Error(`unexpected closing tag: </${closingName}>`);
      }
      stack.pop();
      continue;
    }

    const selfClosing = token.endsWith("/");
    const body = selfClosing ? token.slice(0, -1).trim() : token;
    const node = parseOpenTag(body);
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) stack.push(node);
  }

  if (stack.length !== 1) {
    throw new Error(`unclosed XML tag: <${stack[stack.length - 1].name}>`);
  }
  const roots = documentNode.children.filter((child): child is XmlNode => typeof child !== "string");
  if (roots.length !== 1) throw new Error("SVG file must contain exactly one root element");
  return roots[0];
}

function parseOpenTag(body: string): XmlNode {
  const nameMatch = body.match(/^([^\s/>]+)/);
  if (nameMatch === null) throw new Error("invalid XML tag");
  const name = nameMatch[1];
  const attributes: Record<string, string> = {};
  let position = name.length;

  while (position < body.length) {
    while (/\s/.test(body[position] ?? "")) position += 1;
    if (position >= body.length) break;

    const attributeMatch = body.slice(position).match(/^([^\s=/>]+)/);
    if (attributeMatch === null) throw new Error(`invalid attribute on <${name}>`);
    const attributeName = attributeMatch[1];
    position += attributeName.length;
    while (/\s/.test(body[position] ?? "")) position += 1;
    if (body[position] !== "=") throw new Error(`missing '=' after ${attributeName}`);
    position += 1;
    while (/\s/.test(body[position] ?? "")) position += 1;

    const delimiter = body[position];
    if (delimiter !== '"' && delimiter !== "'") {
      throw new Error(`attribute ${attributeName} must be quoted`);
    }
    position += 1;
    const valueStart = position;
    while (position < body.length && body[position] !== delimiter) position += 1;
    if (position >= body.length) throw new Error(`unterminated ${attributeName} attribute`);
    if (attributes[attributeName] !== undefined) {
      throw new Error(`duplicate attribute: ${attributeName}`);
    }
    attributes[attributeName] = decodeEntities(body.slice(valueStart, position));
    position += 1;
  }

  return { name, attributes, children: [] };
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, name: string) => {
    if (name === "amp") return "&";
    if (name === "lt") return "<";
    if (name === "gt") return ">";
    if (name === "quot") return '"';
    if (name === "apos") return "'";
    const codePoint = name.startsWith("#x") || name.startsWith("#X")
      ? Number.parseInt(name.slice(2), 16)
      : Number.parseInt(name.slice(1), 10);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
      throw new Error(`invalid XML entity: ${entity}`);
    }
    return String.fromCodePoint(codePoint);
  });
}
