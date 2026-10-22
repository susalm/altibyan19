import mukhtasarFullJson from "../data/mukhtasar_full.json";
import muyassarFullJson from "../data/tafsir_muyassar_full.json";

const mukhtasarMap = mukhtasarFullJson as Record<string, string>;
const muyassarMap = muyassarFullJson as Record<string, string>;

export function getOfflineMukhtasarTafsir(surahNumber: number, ayahNumber: number): string | null {
  const key = `${surahNumber}:${ayahNumber}`;
  return mukhtasarMap[key] || muyassarMap[key] || null;
}

export function getOfflineMukhtasarTafsirFallback(surahNumber: number, ayahNumber: number, _surahName?: string, _ayahText?: string): string | null {
  return getOfflineMukhtasarTafsir(surahNumber, ayahNumber);
}
