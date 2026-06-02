import { describe, expect, it } from "vitest";
import { loadThemePreference, saveThemePreference } from "./theme";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    values
  };
}

describe("theme preference storage", () => {
  it("loads a valid versioned preference", () => {
    const storage = createStorage({ "impostor-theme:v1": "light" });

    expect(loadThemePreference(storage)).toBe("light");
  });

  it("falls back when the stored preference is invalid", () => {
    const storage = createStorage({ "impostor-theme:v1": "solarized" });

    expect(loadThemePreference(storage)).toBe("dark");
  });

  it("migrates a valid legacy preference", () => {
    const storage = createStorage({ "impostor-theme": "light" });

    expect(loadThemePreference(storage)).toBe("light");
    expect(storage.values.get("impostor-theme:v1")).toBe("light");
    expect(storage.values.has("impostor-theme")).toBe(false);
  });

  it("does not throw when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("storage unavailable");
      },
      removeItem: () => {
        throw new Error("storage unavailable");
      },
      setItem: () => {
        throw new Error("storage unavailable");
      }
    };

    expect(loadThemePreference(storage)).toBe("dark");
    expect(() => saveThemePreference("light", storage)).not.toThrow();
  });
});
