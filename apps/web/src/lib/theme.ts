export type ThemePreference = "dark" | "light";

type ThemeStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const themeStorageKey = "impostor-theme:v1";
const legacyThemeStorageKey = "impostor-theme";
const fallbackTheme: ThemePreference = "dark";

export function loadThemePreference(storage: ThemeStorage = window.localStorage): ThemePreference {
  try {
    const storedTheme = storage.getItem(themeStorageKey);
    if (isThemePreference(storedTheme)) {
      return storedTheme;
    }

    const legacyTheme = storage.getItem(legacyThemeStorageKey);
    if (isThemePreference(legacyTheme)) {
      saveThemePreference(legacyTheme, storage);
      storage.removeItem(legacyThemeStorageKey);
      return legacyTheme;
    }
  } catch {
    return fallbackTheme;
  }

  return fallbackTheme;
}

export function saveThemePreference(
  theme: ThemePreference,
  storage: ThemeStorage = window.localStorage
): void {
  try {
    storage.setItem(themeStorageKey, theme);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "dark" || value === "light";
}
