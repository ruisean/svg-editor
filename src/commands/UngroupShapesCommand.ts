import { Command } from "./Command.js";
import { SvgDocument, ShapeLocation } from "../model/SvgDocument.js";
import { GroupShape } from "../model/shapes/GroupShape.js";

export class UngroupShapesCommand implements Command {
  private group: GroupShape | null = null;
  private originalLocation: ShapeLocation | null = null;
  private childIds: string[] = [];

  constructor(
    private readonly document: SvgDocument,
    private readonly groupId: string,
  ) {}

  execute(): string {
    const shape = this.document.getShape(this.groupId);

    if (shape === undefined) {
      throw new Error(`no such shape: ${this.groupId}`);
    }
    if (!(shape instanceof GroupShape)) {
      throw new Error(`not a container: ${this.groupId}`);
    }
    if (shape.parent === null) {
      throw new Error(`cannot ungroup top-level container: ${this.groupId}`);
    }

    this.group = shape;

    if (this.originalLocation === null) {
      this.originalLocation = this.document.getLocation(this.groupId);
      this.childIds = shape.children.map((child) => child.id);
    }

    const children = shape.children;
    const destinationParentId = shape.parent.id;

    children.forEach((child, index) => {
      this.document.restoreLocation(child.id, {
        parentId: destinationParentId,
        index: this.originalLocation!.index + index,
      });
    });

    this.document.removeShape(this.groupId);
    return `g#${this.groupId} ungrouped`;
  }

  undo(): string {
    if (this.group === null || this.originalLocation === null) {
      throw new Error("cannot undo ungroup");
    }

    this.document.addShape(this.group);
    this.document.restoreLocation(this.groupId, this.originalLocation);

    for (const childId of this.childIds) {
      this.document.addTo(this.groupId, childId);
    }

    return `g#${this.groupId} restored`;
  }
}