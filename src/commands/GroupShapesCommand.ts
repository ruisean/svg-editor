import { Command } from "./Command.js";
import { SvgDocument, ShapeLocation } from "../model/SvgDocument.js";
import { GroupShape } from "../model/shapes/GroupShape.js";

export class GroupShapesCommand implements Command {
  private readonly group: GroupShape;
  private previousLocations: ShapeLocation[] | null = null;

  constructor(
    private readonly document: SvgDocument,
    groupId: string,
    private readonly shapeIds: string[],
  ) {
    this.group = new GroupShape(groupId);
  }

  execute(): string {
    if (this.shapeIds.length < 2) {
      throw new Error("group requires at least two shapes");
    }

    if (new Set(this.shapeIds).size !== this.shapeIds.length) {
      throw new Error("group contains duplicate shape ids");
    }

    const shapes = this.shapeIds.map((id) => {
      const shape = this.document.getShape(id);
      if (shape === undefined) {
        throw new Error(`no such shape: ${id}`);
      }
      return shape;
    });

    for (const shape of shapes) {
      if (
        shape instanceof GroupShape &&
        shapes.some((other) => other !== shape && shape.contains(other.id))
      ) {
        throw new Error(
          `cannot group a container into its own descendant: ${shape.id}`,
        );
      }
    }

    if (this.previousLocations === null) {
      this.previousLocations = this.shapeIds.map((id) =>
        this.document.getLocation(id),
      );
    }

    this.document.addShape(this.group);
    const movedIds: string[] = [];

    try {
      for (const id of this.shapeIds) {
        this.document.addTo(this.group.id, id);
        movedIds.push(id);
      }
    } catch (error) {
      for (const id of movedIds.reverse()) {
        const index = this.shapeIds.indexOf(id);
        const location = this.previousLocations[index];
        if (location !== undefined) {
          this.document.restoreLocation(id, location);
        }
      }

      this.document.removeShape(this.group.id);
      throw error;
    }

    return `g#${this.group.id} created with ${this.shapeIds.length} children`;
  }

  undo(): string {
    if (this.previousLocations === null) {
      throw new Error("cannot undo group");
    }

    this.shapeIds.forEach((id, index) => {
      const location = this.previousLocations?.[index];
      if (location !== undefined) {
        this.document.restoreLocation(id, location);
      }
    });

    this.document.removeShape(this.group.id);
    return `g#${this.group.id} grouping undone`;
  }
}