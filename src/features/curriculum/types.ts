export interface LessonContent {
  objectives: string[];
  theory: string[];
  code: string;
  explanation: string;
  output: string;
  mistakes: string[];
  summary: string[];
  exercises: string[];
}

export interface Lesson {
  slug: string;
  title: string;
  minutes: number;
  objectives: string[];
  theory: string[];
  code: string;
  explanation: string;
  output: string;
  mistakes: string[];
  summary: string[];
  exercises: string[];
}

export interface Chapter {
  slug: string;
  title: string;
  lessons: Lesson[];
}

export interface LearningLevel {
  slug: string;
  name: string;
  rank: number;
  description: string;
  courseTitle: string;
  chapters: Chapter[];
}

export type LessonStatus = "not_started" | "in_progress" | "completed";

export interface LessonProgress {
  status: Exclude<LessonStatus, "not_started">;
  startedAt: string;
  lastOpenedAt: string;
  completedAt: string | null;
}

export interface LearningProgress {
  lessons: Record<string, LessonProgress>;
  lastLessonSlug: string | null;
}
