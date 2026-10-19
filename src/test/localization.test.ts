import { getLocalizedValue } from "@/utils/localization";

describe("getLocalizedValue", () => {
  it("returns a plain string unchanged", () => {
    expect(getLocalizedValue("Policy", "ar")).toBe("Policy");
  });

  it("prefers the requested language", () => {
    expect(getLocalizedValue({ en: "Policy", ar: "سياسة" }, "ar")).toBe(
      "سياسة",
    );
  });

  it("falls back to English, then Arabic", () => {
    expect(getLocalizedValue({ en: "Procedure", ar: "" }, "ar")).toBe(
      "Procedure",
    );
    expect(getLocalizedValue({ en: "", ar: "إجراء" }, "en")).toBe("إجراء");
  });

  it("returns an empty string for absent values", () => {
    expect(getLocalizedValue(undefined, "ar")).toBe("");
    expect(getLocalizedValue(null, "en")).toBe("");
  });
});
