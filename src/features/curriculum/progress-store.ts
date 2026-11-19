import type { LearningProgress, LessonProgress } from "./types";

const STORAGE_KEY = "python-learning-hub:learning-progress:v1";
const CHANGE_EVENT = "python-learning-hub:progress-change";
const EMPTY_PROGRESS: LearningProgress = { lessons: {}, lastLessonSlug: null };

let cachedRaw: string | null = null;
let cachedProgress: LearningProgress = EMPTY_PROGRESS;

function parseProgress(raw: string | null): LearningProgress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return EMPTY_PROGRESS;
    const candidate = value as Partial<LearningProgress>;
    if (!candidate.lessons || typeof candidate.lessons !== "object") return EMPTY_PROGRESS;
    return {
      lessons: candidate.lessons,
      lastLessonSlug: typeof candidate.lastLessonSlug === "string" ? candidate.lastLessonSlug : null,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function getProgressSnapshot(): LearningProgress {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedProgress;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedProgress = parseProgress(raw);
  }
  return cachedProgress;
}

export function getProgressServerSnapshot(): LearningProgress {
  return EMPTY_PROGRESS;
}

export function subscribeToProgress(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function saveProgress(progress: LearningProgress) {
  const raw = JSON.stringify(progress);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Keep this session usable when browser storage is unavailable.
  }
  cachedRaw = raw;
  cachedProgress = progress;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function recordLessonOpened(slug: string) {
  const progress = getProgressSnapshot();
  const now = new Date().toISOString();
  const current = progress.lessons[slug];
  const next: LessonProgress = current?.status === "completed"
    ? { ...current, lastOpenedAt: now }
    : {
        status: "in_progress",
        startedAt: current?.startedAt ?? now,
        lastOpenedAt: now,
        completedAt: null,
      };
  saveProgress({
    lessons: { ...progress.lessons, [slug]: next },
    lastLessonSlug: slug,
  });
}

export function markLessonCompleted(slug: string) {
  const progress = getProgressSnapshot();
  const now = new Date().toISOString();
  const current = progress.lessons[slug];
  saveProgress({
    lessons: {
      ...progress.lessons,
      [slug]: {
        status: "completed",
        startedAt: current?.startedAt ?? now,
        lastOpenedAt: now,
        completedAt: current?.completedAt ?? now,
      },
    },
    lastLessonSlug: slug,
  });
}
