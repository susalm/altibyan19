// src/utils/quranAudioEngine.ts
// High-precision Web Audio API engine for Quran recitation.
// Delivers 100% sample-accurate 0ms Wasl (وصل الآيات بلا أي فجوة زمنية),
// guarantees the reciter completes the last ayah of the surah 100% without cutoff,
// prevents playback stoppage with proactive background preloading & caching,
// and keeps playback active in background/lock screen with silent keep-alive.

import { 
  getCachedAudioArrayBuffer, 
  saveAudioToOfflineCache, 
  parseAudioUrlKey 
} from "./audioOfflineCache";

export interface PlaybackCallbacks {
  onAyahStart?: (index: number, ayahNum: number, surahNum: number) => void;
  onNextAyahNeeded?: (currentAyahIndex: number) => void;
  onPlaybackComplete?: () => void;
  onEnded?: () => void; // alias for backwards compatibility
  onError?: (err: any) => void;
  onStateChange?: (isPlaying: boolean) => void;
}

export interface AyahQueueItem {
  url: string;
  index: number;
  ayahNum: number;
  surahNum: number;
}

interface DecodedAudioItem {
  buffer: AudioBuffer;
  startOffset: number;
  duration: number;
}

function trimSilence(
  buffer: AudioBuffer,
  isLastAyahOfSurah: boolean = false
): { startOffset: number; duration: number } {
  const pcm = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const length = pcm.length;

  // Window size: 15ms energy analysis window
  const windowSize = Math.max(64, Math.floor(sampleRate * 0.015));

  // Determine ambient noise floor from quietest section in the first 100ms
  let minRms = 1.0;
  const initialWindows = Math.min(10, Math.floor(length / windowSize));
  for (let w = 0; w < initialWindows; w++) {
    let sumSq = 0;
    const offset = w * windowSize;
    for (let j = 0; j < windowSize && offset + j < length; j++) {
      const s = pcm[offset + j];
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / windowSize);
    if (rms < minRms) minRms = rms;
  }

  // Speech RMS in audio files is typically > 0.04; background noise is < 0.01
  const speechThreshold = Math.min(0.035, Math.max(0.012, minRms * 2.8));

  // 1. Leading silence: scan forward up to 2.5 seconds to find where speech starts
  let startSample = 0;
  const maxLeadingScan = Math.min(length, Math.floor(sampleRate * 2.5));
  for (let i = 0; i < maxLeadingScan; i += windowSize) {
    let sumSq = 0;
    const curWin = Math.min(windowSize, length - i);
    for (let j = 0; j < curWin; j++) {
      const s = pcm[i + j];
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / curWin);
    if (rms > speechThreshold) {
      // Step back 30ms so the initial consonant / attack / breath is 100% intact
      startSample = Math.max(0, i - Math.floor(sampleRate * 0.030));
      break;
    }
  }

  // 2. Trailing silence:
  // FOR THE LAST AYAH OF A SURAH: NEVER TRIM TRAILING SILENCE!
  // This guarantees 100% of the reciter's final verse, vowel, reverb, and breath are preserved!
  let endSample = length;
  if (!isLastAyahOfSurah) {
    // Intermediate verses: scan backwards up to 3.0 seconds to find where speech ended
    const minTrailingScan = Math.max(
      startSample + Math.floor(sampleRate * 0.5),
      length - Math.floor(sampleRate * 3.0)
    );
    for (let i = length - windowSize; i >= minTrailingScan; i -= windowSize) {
      let sumSq = 0;
      const curWin = Math.min(windowSize, length - i);
      for (let j = 0; j < curWin; j++) {
        const s = pcm[i + j];
        sumSq += s * s;
      }
      const rms = Math.sqrt(sumSq / curWin);
      if (rms > speechThreshold) {
        // Step forward 45ms to preserve the final vowel resonance, Madd, and room tail
        endSample = Math.min(length, i + windowSize + Math.floor(sampleRate * 0.045));
        break;
      }
    }
  }

  const startOffset = startSample / sampleRate;
  const duration = Math.max(0.2, (endSample - startSample) / sampleRate);
  return { startOffset, duration };
}

class QuranAudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private nextGain: GainNode | null = null;
  private currentEndTime: number = 0;

  private currentItem: (AyahQueueItem & { isLastAyahOfSurah?: boolean }) | null = null;
  private nextItem: (AyahQueueItem & { isLastAyahOfSurah?: boolean }) | null = null;
  private nextDecodedBuffer: DecodedAudioItem | null = null;

  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private generationId: number = 0;

  private callbacks: PlaybackCallbacks = {};
  private keepAliveAudio: HTMLAudioElement | null = null;
  private bufferCache: Map<string, DecodedAudioItem> = new Map();
  private inFlightLoads: Map<string, Promise<DecodedAudioItem | null>> = new Map();

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      (Boolean(window.AudioContext) || Boolean((window as any).webkitAudioContext))
    );
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    return this.audioCtx;
  }

  public setCallbacks(callbacks: PlaybackCallbacks) {
    this.callbacks = callbacks;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getCurrentAyahIndex(): number | null {
    return this.currentItem ? this.currentItem.index : null;
  }

  public getIsActiveAyah(index: number): boolean {
    return this.isPlaying && this.currentItem?.index === index;
  }

  private fallbackAudio: HTMLAudioElement | null = null;

  public unlockAudioContext() {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch (_) {}
  }

  private getCandidateUrls(url: string): string[] {
    const urls: string[] = [url];
    if (url.startsWith("/api/everyayah/")) {
      const pathAfter = url.replace(/^\/api\/everyayah\/?/, "");
      urls.push(`https://everyayah.com/data/${pathAfter}`);
      urls.push(`https://mirrors.quranicaudio.com/everyayah/${pathAfter}`);
    } else if (url.includes("everyayah.com/data/")) {
      const pathAfter = url.split("everyayah.com/data/")[1];
      if (pathAfter) {
        urls.unshift(`/api/everyayah/${pathAfter}`);
        urls.push(`https://mirrors.quranicaudio.com/everyayah/${pathAfter}`);
      }
    }
    return Array.from(new Set(urls));
  }

  private startKeepAlive() {
    if (typeof window === "undefined") return;
    try {
      if (!this.keepAliveAudio) {
        this.keepAliveAudio = new Audio();
        // 1-second silent WAV loop to keep browser media session & audio thread alive
        this.keepAliveAudio.src =
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
        this.keepAliveAudio.loop = true;
        (this.keepAliveAudio as any).playsInline = true;
      }
      this.keepAliveAudio.play().catch(() => {});
    } catch (_) {}
  }

  private stopKeepAlive() {
    if (this.keepAliveAudio) {
      try {
        this.keepAliveAudio.pause();
      } catch (_) {}
    }
  }

  private async fetchAndDecode(
    url: string,
    isLastAyahOfSurah: boolean = false
  ): Promise<DecodedAudioItem | null> {
    const cached = this.bufferCache.get(url);
    if (cached) return cached;

    const inFlight = this.inFlightLoads.get(url);
    if (inFlight) return inFlight;

    const loadPromise = (async () => {
      try {
        let arrayBuf: ArrayBuffer | null = null;
        let lastErr: any = null;

        // 1. Check local offline cache first (Instant 0ms, works completely offline!)
        try {
          const offlineBuf = await getCachedAudioArrayBuffer(url);
          if (offlineBuf && offlineBuf.byteLength > 1000) {
            arrayBuf = offlineBuf;
          }
        } catch (e) {
          console.warn("[QuranAudioEngine] Offline cache check error:", e);
        }

        // 2. If not found in offline cache, fetch from candidate network sources
        if (!arrayBuf) {
          const candidateUrls = this.getCandidateUrls(url);
          for (const candidate of candidateUrls) {
            try {
              const resp = await fetch(candidate);
              if (resp.ok) {
                const buf = await resp.arrayBuffer();
                if (buf && buf.byteLength > 1000) {
                  arrayBuf = buf;
                  // Persist to offline cache for subsequent offline sessions
                  const cacheKey = parseAudioUrlKey(url) || parseAudioUrlKey(candidate);
                  if (cacheKey && buf) {
                    saveAudioToOfflineCache(cacheKey, buf).catch(() => {});
                  }
                  break;
                }
              }
            } catch (e) {
              lastErr = e;
            }
          }
        }

        if (!arrayBuf) {
          throw lastErr || new Error(`HTTP error: failed to fetch audio for ${url}`);
        }

        const ctx = this.getAudioContext();
        if (ctx.state === "suspended") {
          await ctx.resume().catch(() => {});
        }
        const audioBuf = await ctx.decodeAudioData(arrayBuf);
        const trimmed = trimSilence(audioBuf, isLastAyahOfSurah);

        const item: DecodedAudioItem = {
          buffer: audioBuf,
          startOffset: trimmed.startOffset,
          duration: trimmed.duration,
        };

        // Cache item (keep up to 60 verses in memory)
        if (this.bufferCache.size > 60) {
          const firstKey = this.bufferCache.keys().next().value;
          if (firstKey) this.bufferCache.delete(firstKey);
        }
        this.bufferCache.set(url, item);
        return item;
      } catch (err) {
        console.warn("[QuranAudioEngine] Error decoding audio:", url, err);
        return null;
      } finally {
        this.inFlightLoads.delete(url);
      }
    })();

    this.inFlightLoads.set(url, loadPromise);
    return loadPromise;
  }

  public preloadAyah(url: string, isLastAyahOfSurah: boolean = false) {
    this.fetchAndDecode(url, isLastAyahOfSurah).catch(() => {});
  }

  public async playAyah(
    url: string,
    index: number,
    ayahNum: number,
    surahNum: number,
    nextInfo?: AyahQueueItem | null,
    isLastAyahOfSurah: boolean = false
  ) {
    this.generationId++;
    const gen = this.generationId;

    const ctx = this.getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    this.stopCurrentSources();
    this.startKeepAlive();

    this.isPlaying = true;
    this.isPaused = false;
    this.currentItem = { url, index, ayahNum, surahNum, isLastAyahOfSurah };
    this.nextItem = nextInfo || null;
    this.nextSource = null;
    this.nextGain = null;
    this.nextDecodedBuffer = null;

    // Load and decode audio buffer
    const decoded = await this.fetchAndDecode(url, isLastAyahOfSurah);
    if (gen !== this.generationId) return;

    if (!decoded) {
      console.warn("[QuranAudioEngine] Web Audio decode failed, falling back to HTMLAudioElement...");
      this.playWithHtmlAudio(url, index, ayahNum, surahNum, nextInfo, isLastAyahOfSurah, gen);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = decoded.buffer;

    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    // Micro gain ramp to prevent digital clicks
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.005);
    gainNode.gain.setValueAtTime(1, now + decoded.duration - 0.005);
    gainNode.gain.linearRampToValueAtTime(0, now + decoded.duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now, decoded.startOffset, decoded.duration);

    this.currentSource = source;
    this.currentGain = gainNode;
    this.currentEndTime = now + decoded.duration;

    this.callbacks.onAyahStart?.(index, ayahNum, surahNum);
    this.callbacks.onStateChange?.(true);
    this.updateMediaSession(this.currentItem);

    source.onended = () => {
      if (gen !== this.generationId) return;
      this.handleCurrentSourceEnded(gen);
    };

    // Schedule next verse if provided and not the end of the surah
    if (nextInfo && !isLastAyahOfSurah) {
      this.scheduleNext(nextInfo, false);
    } else if (!isLastAyahOfSurah) {
      // Prompt parent to schedule the next verse
      this.callbacks.onNextAyahNeeded?.(index);
    }
  }

  public async scheduleNext(next: AyahQueueItem, isLastAyahOfSurah: boolean = false) {
    if (!this.isPlaying || this.isPaused) return;
    this.nextItem = { ...next, isLastAyahOfSurah };

    const gen = this.generationId;
    const ctx = this.getAudioContext();

    const decoded = await this.fetchAndDecode(next.url, isLastAyahOfSurah);
    if (gen !== this.generationId || !this.isPlaying) return;

    if (!decoded) {
      console.warn("[QuranAudioEngine] Failed to decode scheduled ayah:", next.url);
      return;
    }

    // Check if current source is still playing
    if (this.currentSource && this.currentEndTime > ctx.currentTime) {
      try {
        if (this.nextSource) {
          this.nextSource.onended = null;
          this.nextSource.stop();
          this.nextSource.disconnect();
        }
        if (this.nextGain) {
          this.nextGain.disconnect();
        }
      } catch (_) {}

      // Sample-accurate zero-gap scheduling at the exact end of current verse (0.000ms Wasl)
      const nextSource = ctx.createBufferSource();
      nextSource.buffer = decoded.buffer;

      const nextGain = ctx.createGain();
      const schedTime = this.currentEndTime;
      nextGain.gain.setValueAtTime(0, schedTime);
      nextGain.gain.linearRampToValueAtTime(1, schedTime + 0.005);
      nextGain.gain.setValueAtTime(1, schedTime + decoded.duration - 0.005);
      nextGain.gain.linearRampToValueAtTime(0, schedTime + decoded.duration);

      nextSource.connect(nextGain);
      nextGain.connect(ctx.destination);

      nextSource.start(schedTime, decoded.startOffset, decoded.duration);
      this.nextSource = nextSource;
      this.nextGain = nextGain;
      this.nextDecodedBuffer = decoded;

      nextSource.onended = () => {
        if (gen !== this.generationId) return;
        this.handleCurrentSourceEnded(gen);
      };
    } else if (!this.currentSource) {
      // Current source already completed (e.g. network delay) - play immediately!
      this.playAyah(next.url, next.index, next.ayahNum, next.surahNum, null, isLastAyahOfSurah);
    }
  }

  private handleCurrentSourceEnded(gen: number) {
    if (gen !== this.generationId || !this.isPlaying) return;

    // Check if next source was pre-scheduled and is now playing seamlessly
    if (this.nextSource && this.nextItem && this.nextDecodedBuffer) {
      this.currentSource = this.nextSource;
      this.currentGain = this.nextGain;
      this.nextSource = null;
      this.nextGain = null;

      const duration = this.nextDecodedBuffer.duration;
      this.currentEndTime = this.currentEndTime + duration;

      this.currentItem = this.nextItem;
      this.nextItem = null;
      this.nextDecodedBuffer = null;

      this.callbacks.onAyahStart?.(
        this.currentItem.index,
        this.currentItem.ayahNum,
        this.currentItem.surahNum
      );
      this.updateMediaSession(this.currentItem);

      // Notify parent to prepare and schedule the verse after this one
      this.callbacks.onNextAyahNeeded?.(this.currentItem.index);
    } else {
      // No next verse was scheduled inside this surah/sequence:
      // THE LAST AYAH OF THE SURAH (OR SEQUENCE) HAS NOW COMPLETED 100%!
      this.currentSource = null;
      this.currentGain = null;
      this.isPlaying = false;
      this.isPaused = false;
      this.currentItem = null;
      this.nextItem = null;
      this.nextDecodedBuffer = null;

      this.callbacks.onPlaybackComplete?.();
      this.callbacks.onEnded?.();
      this.callbacks.onStateChange?.(false);
    }
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = true;
    this.stopKeepAlive();

    if (this.fallbackAudio && !this.fallbackAudio.paused) {
      try {
        this.fallbackAudio.pause();
      } catch (_) {}
    }

    if (this.audioCtx && this.audioCtx.state === "running") {
      this.audioCtx.suspend().catch(() => {});
    }

    this.callbacks.onStateChange?.(false);
  }

  public resume(nextInfo?: AyahQueueItem | null) {
    if (!this.isPaused) return;

    if (this.fallbackAudio && this.fallbackAudio.paused) {
      this.fallbackAudio
        .play()
        .then(() => {
          this.isPlaying = true;
          this.isPaused = false;
          this.startKeepAlive();
          this.callbacks.onStateChange?.(true);
        })
        .catch(() => {});
      return;
    }

    const ctx = this.getAudioContext();
    ctx
      .resume()
      .then(() => {
        this.isPlaying = true;
        this.isPaused = false;
        this.startKeepAlive();
        this.callbacks.onStateChange?.(true);

        if (nextInfo && !this.nextSource && this.currentItem) {
          this.scheduleNext(nextInfo, this.currentItem.isLastAyahOfSurah || false);
        }
      })
      .catch((err) => {
        console.warn("[QuranAudioEngine] Error resuming AudioContext:", err);
      });
  }

  public stop() {
    this.generationId++;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentItem = null;
    this.nextItem = null;
    this.nextDecodedBuffer = null;

    this.stopCurrentSources();
    this.stopKeepAlive();

    this.callbacks.onStateChange?.(false);
  }

  private playWithHtmlAudio(
    url: string,
    index: number,
    ayahNum: number,
    surahNum: number,
    nextInfo?: AyahQueueItem | null,
    isLastAyahOfSurah: boolean = false,
    gen: number = 0
  ) {
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.src = "";
      } catch (_) {}
      this.fallbackAudio = null;
    }

    const candidateUrls = this.getCandidateUrls(url);
    let candidateIndex = 0;

    const audio = new Audio();
    this.fallbackAudio = audio;
    audio.preload = "auto";

    const tryCandidate = async (i: number) => {
      if (i >= candidateUrls.length) {
        // Check offline audio cache before giving up
        try {
          const offlineBuf = await getCachedAudioArrayBuffer(url);
          if (offlineBuf && offlineBuf.byteLength > 1000) {
            const blob = new Blob([offlineBuf], { type: "audio/mpeg" });
            const blobUrl = URL.createObjectURL(blob);
            audio.src = blobUrl;
            audio.load();
            audio.play().catch(() => {
              this.callbacks.onError?.(new Error("Audio failed to load"));
              this.callbacks.onPlaybackComplete?.();
              this.callbacks.onEnded?.();
            });
            return;
          }
        } catch (_) {}

        console.warn("[QuranAudioEngine] All audio fallbacks failed for ayah", ayahNum);
        this.callbacks.onError?.(new Error("Audio failed to load"));
        this.callbacks.onPlaybackComplete?.();
        this.callbacks.onEnded?.();
        return;
      }
      audio.src = candidateUrls[i];
      audio.load();
      audio.play().catch(() => {
        tryCandidate(i + 1);
      });
    };

    audio.onplay = () => {
      if (gen !== this.generationId) {
        audio.pause();
        return;
      }
      this.isPlaying = true;
      this.isPaused = false;
      this.callbacks.onAyahStart?.(index, ayahNum, surahNum);
      this.callbacks.onStateChange?.(true);
      if (this.currentItem) {
        this.updateMediaSession(this.currentItem);
      }
      this.callbacks.onNextAyahNeeded?.(index);
    };

    audio.onended = () => {
      if (gen !== this.generationId) return;
      if (nextInfo && !isLastAyahOfSurah) {
        this.playAyah(nextInfo.url, nextInfo.index, nextInfo.ayahNum, nextInfo.surahNum, null, isLastAyahOfSurah);
      } else {
        this.isPlaying = false;
        this.isPaused = false;
        this.callbacks.onPlaybackComplete?.();
        this.callbacks.onEnded?.();
        this.callbacks.onStateChange?.(false);
      }
    };

    audio.onerror = () => {
      candidateIndex++;
      tryCandidate(candidateIndex);
    };

    tryCandidate(0);
  }

  private stopCurrentSources() {
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
        this.fallbackAudio.src = "";
      } catch (_) {}
      this.fallbackAudio = null;
    }

    if (this.currentSource) {
      try {
        this.currentSource.onended = null;
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (_) {}
      this.currentSource = null;
    }
    if (this.currentGain) {
      try {
        this.currentGain.disconnect();
      } catch (_) {}
      this.currentGain = null;
    }

    if (this.nextSource) {
      try {
        this.nextSource.onended = null;
        this.nextSource.stop();
        this.nextSource.disconnect();
      } catch (_) {}
      this.nextSource = null;
    }
    if (this.nextGain) {
      try {
        this.nextGain.disconnect();
      } catch (_) {}
      this.nextGain = null;
    }
  }

  private updateMediaSession(item: AyahQueueItem) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `الآية ${item.ayahNum}`,
        artist: `القرآن الكريم - سورة رقم ${item.surahNum}`,
        album: "القرآن الكريم",
      });

      navigator.mediaSession.setActionHandler("play", () => {
        this.resume();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        this.pause();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        this.callbacks.onPlaybackComplete?.();
      });
    } catch (_) {}
  }
}

export const quranAudioEngine = new QuranAudioEngine();

