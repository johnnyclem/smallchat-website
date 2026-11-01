import { describe, expect, it } from "vitest";
import { clip, shortId } from "../format.js";

describe("clip", () => {
  it("leaves a short string alone", () => {
    expect(clip("We're out of eggs.", 40)).toBe("We're out of eggs.");
  });
  it("cuts with one ellipsis", () => {
    expect(clip("There are eggs after all: a carton in the crisper", 20)).toBe("There are eggs afte…");
  });
  it("never puts a sentence end or a space before the ellipsis", () => {
    expect(clip("We're out of eggs. Saturday's dozen is gone", 19)).toBe("We're out of eggs…");
    expect(clip("Overridden, then; struck: and so on", 17)).toBe("Overridden, then…");
  });
});

describe("shortId", () => {
  it("shortens a ULID to one shape", () => {
    expect(shortId("01M5C8V900R9FK5H7CESZ5NQEX")).toBe("01M5C8…NQEX");
  });
});
