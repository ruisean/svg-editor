import { Shape } from "./Shape.js";
import { GroupShape } from "./shapes/GroupShape.js";

export type ShapeLocation = { parentId: string | null; index: number };

export class SvgDocument {
  private _width: number;
  private _height: number;
  private readonly _shapes = new Map<string, Shape>();
  private readonly _rootShapes: Shape[] = [];

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

  addShape(shape: Shape): void {
    const tree = this.collectTree(shape);
    for (const item of tree) {
      if (this._shapes.has(item.id)) throw new Error(`id already exists: ${item.id}`);
    }
    for (const item of tree) this._shapes.set(item.id, item);
    this._rootShapes.push(shape);
  }

  getShape(id: string): Shape | undefined {
    return this._shapes.get(id);
  }

  getShapes(): Shape[] {
    return [...this._rootShapes];
  }

  removeShape(id: string): Shape | undefined {
    const shape = this._shapes.get(id);

    if (shape === undefined) {
      return undefined;
    }

    this.detach(shape, this.locate(shape).index);
    this.removeFromRegistry(shape);
    return shape;
  }

  getLocation(shapeId: string): ShapeLocation {
    const shape = this._shapes.get(shapeId);
    if (shape === undefined) throw new Error(`no such shape: ${shapeId}`);
    return this.locate(shape);
  }

  addTo(containerId: string, shapeId: string): ShapeLocation {
    const container = this._shapes.get(containerId);
    const shape = this._shapes.get(shapeId);

    if (container === undefined) throw new Error(`no such container: ${containerId}`);
    if (!(container instanceof GroupShape)) throw new Error(`not a container: ${containerId}`);
    if (shape === undefined) throw new Error(`no such shape: ${shapeId}`);
    if (shape === container || (shape instanceof GroupShape && shape.contains(containerId))) {
      throw new Error(`cannot move a container into its own descendant: ${shapeId}`);
    }

    const location = this.locate(shape);
    if (location.parentId === containerId) {
      throw new Error(`${shapeId} is already in ${containerId}`);
    }

    this.detach(shape, location.index);
    container.addChild(shape);
    return location;
  }

  restoreLocation(shapeId: string, location: ShapeLocation): void {
    const shape = this._shapes.get(shapeId);
    if (shape === undefined) throw new Error(`no such shape: ${shapeId}`);

    this.detach(shape, this.locate(shape).index);

    if (location.parentId === null) {
      this._rootShapes.splice(location.index, 0, shape);
      shape.setParent(null);
      return;
    }

    const parent = this._shapes.get(location.parentId);
    if (!(parent instanceof GroupShape)) throw new Error(`not a container: ${location.parentId}`);
    parent.insertChildAt(location.index, shape);
  }

  moveToFront(shapeId: string): ShapeLocation {
    const shape = this._shapes.get(shapeId);
    if (shape === undefined) throw new Error(`no such shape: ${shapeId}`);

    const location = this.locate(shape);
    this.detach(shape, location.index);
    if (location.parentId === null) {
      this._rootShapes.push(shape);
    } else {
      const parent = this._shapes.get(location.parentId);
      if (!(parent instanceof GroupShape)) {
        throw new Error(`not a container: ${location.parentId}`);
      }
      parent.addChild(shape);
    }
    return location;
  }

  moveToBack(shapeId: string): ShapeLocation {
    const shape = this._shapes.get(shapeId);
    if (shape === undefined) throw new Error(`no such shape: ${shapeId}`);

    const location = this.locate(shape);
    this.detach(shape, location.index);
    if (location.parentId === null) {
      this._rootShapes.unshift(shape);
    } else {
      const parent = this._shapes.get(location.parentId);
      if (!(parent instanceof GroupShape)) {
        throw new Error(`not a container: ${location.parentId}`);
      }
      parent.insertChildAt(0, shape);
    }
    return location;
  }

  restoreDeleted(shape: Shape, location: ShapeLocation): void {
    const parent = location.parentId === null ? null : this._shapes.get(location.parentId);
    if (location.parentId !== null && !(parent instanceof GroupShape)) {
      throw new Error(`not a container: ${location.parentId}`);
    }

    const tree = this.collectTree(shape);
    for (const item of tree) {
      if (this._shapes.has(item.id)) throw new Error(`id already exists: ${item.id}`);
    }
    for (const item of tree) this._shapes.set(item.id, item);

    if (location.parentId === null) {
      shape.setParent(null);
      this._rootShapes.splice(location.index, 0, shape);
      return;
    }
    (parent as GroupShape).insertChildAt(location.index, shape);
  }

  private locate(shape: Shape): ShapeLocation {
    if (shape.parent !== null) {
      return { parentId: shape.parent.id, index: shape.parent.childIndex(shape.id) };
    }
    return { parentId: null, index: this._rootShapes.indexOf(shape) };
  }

  private detach(shape: Shape, index: number): void {
    if (shape.parent !== null) {
      shape.parent.removeChild(shape.id);
    } else if (index >= 0) {
      this._rootShapes.splice(index, 1);
    }
  }

  private removeFromRegistry(shape: Shape): void {
    this._shapes.delete(shape.id);
    if (shape instanceof GroupShape) {
      for (const child of shape.children) this.removeFromRegistry(child);
    }
  }

  private collectTree(shape: Shape): Shape[] {
    const result = [shape];
    if (shape instanceof GroupShape) {
      for (const child of shape.children) result.push(...this.collectTree(child));
    }
    return result;
  }
}
