import englishTranslationJson from "../data/english_translation.json";
import hilaliKhanFullJson from "../data/hilali_khan_full.json";

const englishDict = englishTranslationJson as Record<string, string>;
const hilaliKhanDict = hilaliKhanFullJson as Record<string, string>;

/**
 * Retrieves English translation (Sahih International) for a given Surah and Ayah from local offline dataset
 */
export function getOfflineEnglishTranslation(surahNumber: number, ayahNumber: number): string | null {
  const key = `${surahNumber}:${ayahNumber}`;
  if (englishDict && englishDict[key]) {
    return englishDict[key];
  }
  return null;
}

/**
 * Retrieves full authentic Dr. Al-Hilali & Dr. Muhsin Khan English translation (all 6,236 ayahs) completely offline
 */
export function getOfflineHilaliKhanTranslation(surahNumber: number, ayahNumber: number): string | null {
  const key = `${surahNumber}:${ayahNumber}`;
  if (hilaliKhanDict && hilaliKhanDict[key]) {
    return hilaliKhanDict[key];
  }
  return null;
}
