import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error módulo .mjs sin tipos
import { tomarTarea } from "../trabajador.mjs";

describe("tomarTarea (cola de render repartido)", () => {
  it("cada PC toma una tarea distinta y no queda ninguna repetida", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cola-"));
    const sub = path.join(dir, "comp_abc");
    fs.mkdirSync(sub);
    for (const k of [0, 1]) fs.writeFileSync(path.join(sub, `parte_00${k}.json`), JSON.stringify({ nombre: `parte_00${k}` }));
    const a = tomarTarea(dir, "PC1");
    const b = tomarTarea(dir, "PC2");
    expect([a.nombre, b.nombre].sort()).toEqual(["parte_000", "parte_001"]);
    expect(tomarTarea(dir, "PC3")).toBeNull();
    expect(fs.existsSync(path.join(sub, "parte_000.json.PC1"))).toBe(true);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
