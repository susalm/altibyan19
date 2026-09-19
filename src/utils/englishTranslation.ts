import englishTranslationJson from "../data/english_translation.json";

const englishDict = englishTranslationJson as Record<string, string>;

/**
 * Retrieves English translation for a given Surah and Ayah from local offline dataset
 */
export function getOfflineEnglishTranslation(surahNumber: number, ayahNumber: number): string | null {
  const key = `${surahNumber}:${ayahNumber}`;
  if (englishDict && englishDict[key]) {
    return englishDict[key];
  }
  return null;
}
