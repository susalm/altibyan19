import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";

export function isNativeCapacitor(): boolean {
  try {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isShareCancelledError(err: unknown): boolean {
  const anyErr = err as { name?: string; code?: number | string; message?: string } | null;
  const msg = String(anyErr?.message || "").toLowerCase();
  return (
    anyErr?.name === "AbortError" ||
    anyErr?.code === 20 ||
    msg.includes("cancel") ||
    msg.includes("abort") ||
    msg.includes("dismiss")
  );
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIdx = result.indexOf(",");
      if (commaIdx !== -1) {
        resolve(result.slice(commaIdx + 1));
      } else {
        reject(new Error("Invalid data URL from FileReader"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

export async function resolveImageBase64(
  targetUrl?: string | null,
  blob?: Blob | null
): Promise<string | null> {
  try {
    if (blob && blob.size > 0) {
      return await blobToBase64(blob);
    }
    if (targetUrl && targetUrl.startsWith("data:")) {
      const commaIdx = targetUrl.indexOf(",");
      return commaIdx !== -1 ? targetUrl.slice(commaIdx + 1) : null;
    }
    if (targetUrl) {
      const res = await fetch(targetUrl);
      const fetchedBlob = await res.blob();
      if (fetchedBlob && fetchedBlob.size > 0) {
        return await blobToBase64(fetchedBlob);
      }
    }
  } catch (err) {
    console.warn("resolveImageBase64 failed:", err);
  }
  return null;
}

function makeAsciiPngFileName(rawName: string): string {
  const cleaned = rawName
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = cleaned && cleaned.length >= 4 ? cleaned.replace(/\.png$/i, "") : "mushaf_altibyan_card";
  return `${base}_${Date.now()}.png`;
}

export async function shareImageOnCapacitor(params: {
  base64Data: string;
  fileName: string;
  title: string;
  text: string;
  dialogTitle?: string;
}): Promise<{ status: "shared" | "cancelled" | "failed"; error?: string }> {
  if (!isNativeCapacitor()) {
    return { status: "failed", error: "Not running in Capacitor native environment" };
  }

  const safeName = makeAsciiPngFileName(params.fileName);
  const cleanBase64 = params.base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, "").replace(/\s+/g, "");

  try {
    if (Capacitor.isPluginAvailable("Share")) {
      try {
        const canShareRes = await Share.canShare();
        if (canShareRes && canShareRes.value === false) {
          return { status: "failed", error: "Capacitor Share reported unsupported" };
        }
      } catch {
        // Proceed to share attempt if canShare throws on older OS
      }
    }

    let fileUri = "";
    try {
      const writeRes = await Filesystem.writeFile({
        path: safeName,
        data: cleanBase64,
        directory: Directory.Cache,
      });
      fileUri = writeRes.uri;
    } catch (cacheErr) {
      console.warn("Directory.Cache write failed, trying Directory.ExternalCache:", cacheErr);
      const extWriteRes = await Filesystem.writeFile({
        path: safeName,
        data: cleanBase64,
        directory: Directory.ExternalCache,
      });
      fileUri = extWriteRes.uri;
    }

    try {
      await Share.share({
        title: params.title,
        text: params.text,
        files: [fileUri],
        dialogTitle: params.dialogTitle || "مشاركة بطاقة الآية",
      });
      return { status: "shared" };
    } catch (shareWithTextErr) {
      if (isShareCancelledError(shareWithTextErr)) {
        return { status: "cancelled" };
      }

      // Some Android targets reject EXTRA_TEXT alongside EXTRA_STREAM
      try {
        await Share.share({
          title: params.title,
          files: [fileUri],
          dialogTitle: params.dialogTitle || "مشاركة بطاقة الآية",
        });
        return { status: "shared" };
      } catch (shareFilesOnlyErr) {
        if (isShareCancelledError(shareFilesOnlyErr)) {
          return { status: "cancelled" };
        }

        // Legacy fallback using url parameter
        try {
          await Share.share({
            title: params.title,
            url: fileUri,
            dialogTitle: params.dialogTitle || "مشاركة بطاقة الآية",
          });
          return { status: "shared" };
        } catch (shareUrlErr) {
          if (isShareCancelledError(shareUrlErr)) {
            return { status: "cancelled" };
          }
          return {
            status: "failed",
            error: String((shareUrlErr as Error)?.message || shareUrlErr),
          };
        }
      }
    }
  } catch (fsErr) {
    console.warn("shareImageOnCapacitor filesystem/share error:", fsErr);
    return {
      status: "failed",
      error: String((fsErr as Error)?.message || fsErr),
    };
  }
}

export async function saveImageOnCapacitor(params: {
  base64Data: string;
  fileName: string;
}): Promise<{ saved: boolean; cancelled?: boolean; sharedFallback?: boolean; location?: string; error?: string }> {
  if (!isNativeCapacitor()) {
    return { saved: false, error: "Not running in Capacitor native environment" };
  }

  const safeName = makeAsciiPngFileName(params.fileName);

  try {
    try {
      const perm = await Filesystem.checkPermissions();
      if (perm.publicStorage !== "granted") {
        await Filesystem.requestPermissions().catch(() => {});
      }
    } catch {
      // Android 10+ scoped storage does not require legacy storage permission for Documents
    }

    // 1. Try public Documents/MushafAltibyan folder
    try {
      await Filesystem.writeFile({
        path: `MushafAltibyan/${safeName}`,
        data: params.base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      return { saved: true, location: "Documents/MushafAltibyan" };
    } catch (docErr) {
      console.warn("Directory.Documents save skipped:", docErr);
    }

    // 2. Try ExternalStorage/Pictures/MushafAltibyan
    try {
      await Filesystem.writeFile({
        path: `Pictures/MushafAltibyan/${safeName}`,
        data: params.base64Data,
        directory: Directory.ExternalStorage,
        recursive: true,
      });
      return { saved: true, location: "Pictures/MushafAltibyan" };
    } catch (extErr) {
      console.warn("Directory.ExternalStorage save skipped:", extErr);
    }

    // 3. Fallback: write to Cache and open Android Share sheet so user can Save to Photos/Files
    const cacheRes = await Filesystem.writeFile({
      path: safeName,
      data: params.base64Data,
      directory: Directory.Cache,
    });

    try {
      await Share.share({
        title: "حفظ بطاقة الآية",
        files: [cacheRes.uri],
        dialogTitle: "حفظ أو مشاركة بطاقة الآية",
      });
      return { saved: true, sharedFallback: true };
    } catch (shareErr) {
      if (isShareCancelledError(shareErr)) {
        return { saved: false, cancelled: true };
      }
      throw shareErr;
    }
  } catch (err) {
    console.warn("saveImageOnCapacitor failed:", err);
    return {
      saved: false,
      error: String((err as Error)?.message || err),
    };
  }
}

export async function shareTextOnCapacitor(params: {
  title: string;
  text: string;
  url?: string;
  dialogTitle?: string;
}): Promise<"shared" | "cancelled" | "unavailable"> {
  if (!isNativeCapacitor()) return "unavailable";
  try {
    await Share.share({
      title: params.title,
      text: params.text,
      url: params.url,
      dialogTitle: params.dialogTitle || params.title,
    });
    return "shared";
  } catch (err) {
    if (isShareCancelledError(err)) return "cancelled";
    return "unavailable";
  }
}

export async function copyTextWithFallback(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below for Android WebView
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
