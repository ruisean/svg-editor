import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const tsxLoader = createRequire(join(projectRoot, "package.json")).resolve("tsx");

function runCli(commands, options = {}) {
  const cwd = options.cwd ?? mkdtempSync(join(tmpdir(), "svg-editor-test-"));
  const result = spawnSync(
    process.execPath,
    ["--import", tsxLoader, join(projectRoot, "src/index.ts")],
    {
      cwd,
      input: `${commands.join("\n")}\nexit\n`,
      encoding: "utf8",
      timeout: 10_000,
    },
  );

  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return { ...result, cwd };
}

function withTempDir(callback) {
  const cwd = mkdtempSync(join(tmpdir(), "svg-editor-test-"));
  try {
    callback(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test("starts without a document, then initializes and reports canvas size", () => {
  const { stdout } = runCli(["tree", "init", "canvas", "init 640 480", "canvas"]);
  assert.match(stdout, /error: no document\. use 'init' or 'read' first/);
  assert.match(stdout, /canvas 800x600 created/);
  assert.match(stdout, /canvas 640x480 created/);
  assert.match(stdout, /canvas 640x480\n/);
});

test("creates all built-in shapes, supports quoted text, show, and tree", () => {
  const { stdout } = runCli([
    "init 400 300",
    "create rect r1 10 20 100 50 blue",
    "create circle c1 50 60 12 red",
    "create ellipse e1 70 80 20 10",
    "create line l1 1 2 3 4 black",
    'create text t1 20 40 "hello SVG world"',
    "create g g1",
    "show t1",
    "tree",
    "tree g1",
  ]);
  for (const expected of [
    "rect#r1 created",
    "circle#c1 created",
    "ellipse#e1 created",
    "line#l1 created",
    "text#t1 created",
    "g#g1 created",
    "text#t1  parent=svg",
    "text=hello SVG world",
    "rect#r1",
    'text#t1 (20,40) "hello SVG world"',
    "g#g1",
  ]) assert.ok(stdout.includes(expected), `missing output: ${expected}`);
});

test("creates shapes inside groups and moves them with undo and redo", () => {
  const { stdout } = runCli([
    "init",
    "create g scene",
    "create rect box 10 20 30 40 green in scene",
    "move scene 5 -2",
    "tree",
    "undo",
    "tree",
    "redo",
    "tree",
  ]);
  assert.match(stdout, /rect#box created in g#scene/);
  assert.match(stdout, /rect#box\s+x=15 y=18 width=30 height=40 fill=green/);
  assert.match(stdout, /rect#box\s+x=10 y=20 width=30 height=40 fill=green/);
  assert.match(stdout, /g#scene moved by \(5,-2\)/);
  assert.match(stdout, /g#scene moved back by \(-5,2\)/);
});

test("groups, undoes grouping, ungroups nested containers, and rejects invalid containment", () => {
  const { stdout } = runCli([
    "init",
    "create rect a 1 1 5 5",
    "create rect b 2 2 5 5",
    "group g1 a b",
    "tree",
    "undo",
    "tree",
    "redo",
    "ungroup g1",
    "undo",
    "create g parent",
    "create g g2 in parent",
    "create rect x 3 3 2 2 in g2",
    "create rect y 4 4 2 2 in g2",
    "tree",
    "ungroup g2",
    "tree",
    "undo",
    "tree",
    "create rect inside 0 0 1 1 in g2",
    "group outer g2 inside",
    "tree",
  ]);
  assert.match(stdout, /g#g1 created with 2 children/);
  assert.match(stdout, /g#g1 grouping undone/);
  assert.match(stdout, /error: cannot ungroup top-level container: g1/);
  assert.match(stdout, /g#g2 ungrouped/);
  assert.match(stdout, /g#g2 restored/);
  assert.match(stdout, /error: cannot group a container into its own descendant: g2/);
  assert.match(stdout, /g#parent  children=1\n\s+└── g#g2/);
  assert.doesNotMatch(stdout, /g#outer created/);
});

test("delete removes a subtree and undo restores it", () => {
  const { stdout } = runCli([
    "init",
    "create g g1",
    "create rect r1 0 0 5 5 in g1",
    "delete g1",
    "show r1",
    "undo",
    "show r1",
  ]);
  assert.match(stdout, /g#g1 deleted/);
  assert.match(stdout, /error: no such shape: r1/);
  assert.match(stdout, /g#g1 restored/);
  assert.match(stdout, /rect#r1  parent=g#g1/);
});

test("set supports undo and escaped text survives SVG serialization", () => {
  withTempDir((cwd) => {
    const { stdout } = runCli([
      "init 200 100",
      'create text t1 10 20 "A & <B>"',
      'set t1 text "C & <D>"',
      "undo",
      "show t1",
      "redo",
      "save drawing.svg",
    ], { cwd });
    assert.match(stdout, /text#t1 updated: text=C & <D>/);
    assert.match(stdout, /text=A & <B>/);
    assert.match(readFileSync(join(cwd, "drawing.svg"), "utf8"), /C &amp; &lt;D&gt;/);
  });
});

test("front and back change sibling order and undo restores it", () => {
  const { stdout } = runCli([
    "init",
    "create rect a 0 0 1 1",
    "create rect b 0 0 1 1",
    "create rect c 0 0 1 1",
    "back c",
    "tree",
    "undo",
    "front a",
    "tree",
  ]);
  const treeBlocks = stdout
    .split("svg> svg (800x600)\n")
    .slice(1)
    .map((block) => block.split("\nsvg>")[0]);
  assert.equal(treeBlocks.length, 2);
  assert.ok(treeBlocks[0].indexOf("rect#c") < treeBlocks[0].indexOf("rect#a"));
  const lastTree = treeBlocks[1];
  assert.ok(lastTree.indexOf("rect#b") < lastTree.indexOf("rect#c"));
  assert.ok(lastTree.indexOf("rect#c") < lastTree.indexOf("rect#a"));
});

test("save and read round-trip SVG; read warns and assigns missing ids", () => {
  withTempDir((cwd) => {
    writeFileSync(join(cwd, "input.svg"), [
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">',
      '  <rect x="0" y="0" width="400" height="300" fill="#fff"/>',
      '  <g id="g1"><circle id="c1" cx="50" cy="60" r="10"/></g>',
      '  <text id="t1" x="10" y="290">imported &amp; safe</text>',
      "</svg>",
    ].join("\n"));
    const { stdout } = runCli([
      "read input.svg",
      "tree",
      "show rect1",
      "save output.svg",
      "read output.svg",
      "tree",
    ], { cwd });
    assert.match(stdout, /warning: assigned id rect1 to unnamed <rect>/);
    assert.match(stdout, /read input\.svg \(400x300\)/);
    assert.match(stdout, /g#g1/);
    assert.match(stdout, /circle#c1/);
    assert.match(stdout, /text#t1 \(10,290\) "imported & safe"/);
    assert.match(stdout, /saved output\.svg/);
    assert.match(readFileSync(join(cwd, "output.svg"), "utf8"), /id="rect1"/);
  });
});

test("document I/O blocks undo until a new edit; failed commands leave state unchanged", () => {
  const { stdout } = runCli([
    "init",
    "undo",
    "create rect r1 0 0 10 10",
    "save state.svg",
    "undo",
    "create rect r1 20 20 10 10",
    "tree",
    "create rect bad 0 0 10 10 in missing",
    "scale r1 0",
    "set r1 unknown value",
    "tree",
  ]);
  assert.match(stdout, /error: undo not allowed after io command/);
  assert.match(stdout, /error: id already exists: r1/);
  assert.match(stdout, /error: no such container: missing/);
  assert.match(stdout, /error: scale factor must be positive/);
  assert.match(stdout, /error: unknown attribute: unknown/);
  assert.equal((stdout.match(/rect#r1\s+x=0 y=0 width=10 height=10/g) ?? []).length, 2);
  assert.doesNotMatch(stdout, /rect#bad/);
});

test("rejects malformed quoted input and documents the command set in help", () => {
  const { stdout } = runCli([
    'create text t1 0 0 "unfinished',
    "help",
  ]);
  assert.match(stdout, /error: unterminated quoted argument/);
  for (const command of ["init", "read", "save", "canvas", "create", "group", "ungroup", "addto", "front", "back", "undo", "redo", "tree", "show", "exit"]) {
    assert.ok(stdout.includes(command), `help should include ${command}`);
  }
});
