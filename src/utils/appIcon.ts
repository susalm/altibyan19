/**
 * Utility functions for managing dynamic application icons
 * Supports:
 * 1. Approved Default Icon (الأيقونة المعتمدة والافتراضية - IMG_1767)
 * 2. Alternative Golden Emblem (الأيقونة البديلة - الشعار المذهب الفاخر)
 */

export const DEFAULT_APP_ICON = "/IMG_1767.png"; // IMG_1767 المعتمدة
export const ALT_APP_ICON = "/IMG_1767.png"; // IMG_1767
export const GITHUB_IMG_URL = "https://github.com/susalm/altibyan/blob/main/IMG_1767.png";
export const GITHUB_RAW_IMG_URL = "https://raw.githubusercontent.com/susalm/altibyan/main/IMG_1767.png";
export const LOCAL_IMG_1767_URL = "/IMG_1767.png";

const LOCAL_STORAGE_CUSTOM_ALT_ICON = "app_icon_custom_alt_data";
const LOCAL_STORAGE_ACTIVE_ICON = "app_icon_active_choice";

/**
 * Returns the effective image URL for the chosen icon.
 * Always returns IMG_1767.png by default.
 */
export function getEffectiveIconUrl(iconType: "default" | "alt" = "alt", customUrl?: string): string {
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl;
  }

  const storedCustom = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_CUSTOM_ALT_ICON) : null;
  if (storedCustom && storedCustom.length > 0) {
    return storedCustom;
  }

  return "/IMG_1767.png";
}

/**
 * Dynamically applies the chosen icon to the browser tab (favicon) and Apple touch icon
 */
export function applyAppIconToDocument(iconType: "default" | "alt" = "alt", customUrl?: string): void {
  if (typeof document === "undefined") return;

  const url = getEffectiveIconUrl(iconType, customUrl);

  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ICON, iconType);
  } catch (e) {
    // Ignore quota / access errors
  }

  // Update favicon
  let favicon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.type = "image/png";
  favicon.href = url;

  // Update Apple touch icon
  let appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!appleIcon) {
    appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    document.head.appendChild(appleIcon);
  }
  appleIcon.href = url;

  // Dispatch custom event for in-app UI sync
  window.dispatchEvent(new CustomEvent("app_icon_changed", { detail: { iconType, url } }));
}

/**
 * Saves a custom uploaded image as the second icon (stored in localStorage & synced to server if available)
 */
export async function saveSecondIconData(dataUrl: string): Promise<boolean> {
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_ALT_ICON, dataUrl);
  } catch (e) {
    console.warn("Could not save to localStorage", e);
  }

  // Also notify server to update public/app-icon-2.png on disk
  try {
    await fetch("/api/update-app-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataBase64: dataUrl })
    });
  } catch (e) {
    // Silently continue if server is not reachable
  }

  return true;
}

/**
 * Attempts to download or synchronize the image directly from the GitHub repository URL
 * Source: https://github.com/susalm/altibyan/blob/main/IMG_1767.png
 */
export async function tryFetchGitHubIcon(): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  // 1. Try server-side endpoint first (handles both GitHub raw & workspace copy of IMG_1767.png)
  try {
    const serverRes = await fetch("/api/fetch-github-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (serverRes.ok) {
      const json = await serverRes.json();
      if (json.success && json.dataUrl) {
        await saveSecondIconData(json.dataUrl);
        return { success: true, dataUrl: json.dataUrl };
      }
    }
  } catch (e) {
    // Continue to browser-side fetch
  }

  // 2. Direct browser fetch to raw GitHub URL
  try {
    const res = await fetch(GITHUB_RAW_IMG_URL);
    if (res.ok) {
      const blob = await res.blob();
      if (blob.type.startsWith("image/")) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            await saveSecondIconData(dataUrl);
            resolve({ success: true, dataUrl });
          };
          reader.onerror = () => {
            resolve({ success: false, error: "فشل تحويل الصورة المسترجعة." });
          };
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch (err: any) {
    // Ignore and proceed to static copy
  }

  // 3. Fallback to /IMG_1767.png static asset
  try {
    const localRes = await fetch(LOCAL_IMG_1767_URL);
    if (localRes.ok) {
      const blob = await localRes.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          await saveSecondIconData(dataUrl);
          resolve({ success: true, dataUrl });
        };
        reader.onerror = () => {
          resolve({ success: false, error: "فشل قراءة الملف المحلي." });
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    // Ignore
  }

  return { 
    success: false, 
    error: "تعذر الاتصال بـ GitHub. إذا كان المستودع خاصاً يمكنك رفع ملف IMG_1767.png مباشرة من جهازك." 
  };
}
