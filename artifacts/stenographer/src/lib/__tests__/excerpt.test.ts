/**
 * The Rules section's transcript is built from the walk, so it must keep
 * matching the walk: nine lines, one TB, a refutation that puts the TB back.
 */
import { describe, expect, it } from "vitest";
import { buildExcerpt } from "../excerpt.js";

describe("transcript excerpt", () => {
  it("is the walk's lines down one path, with the TB marked", async () => {
    const { rows, head } = await buildExcerpt();
    expect(rows.map((r) => r.type)).toEqual(["UV", "ADDENDUM", "TRANSITION", "TB", "UV", "TRANSITION", "ADDENDUM", "TRANSITION", "TRANSITION"]);
    expect(rows.map((r) => r.seq)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(rows.filter((r) => r.tb)).toHaveLength(1);
    expect(rows[3].tb).toBe(true);
    expect(rows[3].who).toBe("signed by ada");
    expect(rows[4].who).toContain("contests #4");
    expect(rows[6].text).toMatch(/^refutes #5 on fridge-cam\/tue-18\.40\.jpg/);
    expect(rows[8].text).toBe("#4 becomes active");
    for (const r of rows) expect(r.hash).toMatch(/^[0-9a-f]{12}$/);
    expect(head).toBe(rows[8].hash);
  });
});
