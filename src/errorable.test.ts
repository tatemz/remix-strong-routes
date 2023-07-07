import { describe, expect, it } from "vitest";
import { isError, isSuccess, toError, toSuccess } from ".";

describe(isSuccess.name, () => {
  it("returns true when the errorable is a success", () => {
    expect(isSuccess(["foo", null])).toBe(true);
  });

  it("returns false when the errorable is an error", () => {
    expect(isSuccess([null, new Error("foo")])).toBe(false);
  });
});

describe(isError.name, () => {
  it("returns true when the errorable is an error", () => {
    expect(isError([null, new Error("foo")])).toBe(true);
  });

  it("returns false when the errorable is a success", () => {
    expect(isError(["foo", null])).toBe(false);
  });
});

describe(toSuccess.name, () => {
  it("returns an errorable success", () => {
    expect(toSuccess("foo")).toStrictEqual(["foo", null]);
  });
});

describe(toError.name, () => {
  it("returns an errorable error", () => {
    expect(toError(new Error("foo"))).toStrictEqual([null, new Error("foo")]);
  });
});
