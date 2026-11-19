import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Chapter, LearningLevel, Lesson } from "../types";

interface LevelRow {
  id: string;
  slug: string;
  name: string;
  rank: number;
  description: string;
}

interface CourseRow {
  id: string;
  learning_level_id: string;
  slug: string;
  title: string;
}

interface ChapterRow {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  position: number;
}

interface LessonRow {
  chapter_id: string;
  slug: string;
  title: string;
  position: number;
  estimated_minutes: number;
  content: unknown;
}

export type CurriculumResult =
  | { status: "ready"; curriculum: LearningLevel[] }
  | { status: "empty" }
  | { status: "error"; reason: "not-configured" | "unavailable" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function parseLesson(row: LessonRow): Lesson | null {
  if (!isRecord(row.content)) return null;
  const objectives = stringArray(row.content.objectives);
  const theory = stringArray(row.content.theory);
  const mistakes = stringArray(row.content.mistakes);
  const summary = stringArray(row.content.summary);
  const exercises = stringArray(row.content.exercises);
  const { code, explanation, output } = row.content;

  if (
    !objectives || !theory || !mistakes || !summary || !exercises ||
    typeof code !== "string" || typeof explanation !== "string" || typeof output !== "string"
  ) return null;

  return {
    slug: row.slug,
    title: row.title,
    minutes: row.estimated_minutes,
    objectives,
    theory,
    code,
    explanation,
    output,
    mistakes,
    summary,
    exercises,
  };
}

export async function loadCurriculum(): Promise<CurriculumResult> {
  const supabase = await createClient();
  if (!supabase) return { status: "error", reason: "not-configured" };

  try {
    const [levelsResult, coursesResult, chaptersResult, lessonsResult] = await Promise.all([
      supabase.from("learning_levels").select("id, slug, name, rank, description").order("rank"),
      supabase.from("courses").select("id, learning_level_id, slug, title").order("title"),
      supabase.from("chapters").select("id, course_id, slug, title, position").order("position"),
      supabase.from("lessons").select("chapter_id, slug, title, position, estimated_minutes, content").order("position"),
    ]);

    if (levelsResult.error || coursesResult.error || chaptersResult.error || lessonsResult.error) {
      return { status: "error", reason: "unavailable" };
    }

    const levels = levelsResult.data as LevelRow[];
    if (levels.length === 0) return { status: "empty" };

    const courses = coursesResult.data as CourseRow[];
    const chapterRows = chaptersResult.data as ChapterRow[];
    const lessonRows = lessonsResult.data as LessonRow[];
    const lessonByChapter = new Map<string, Lesson[]>();

    for (const row of lessonRows) {
      const lesson = parseLesson(row);
      if (!lesson) return { status: "error", reason: "unavailable" };
      const items = lessonByChapter.get(row.chapter_id) ?? [];
      items.push(lesson);
      lessonByChapter.set(row.chapter_id, items);
    }

    const chaptersByCourse = new Map<string, Chapter[]>();
    for (const row of chapterRows) {
      const lessons = lessonByChapter.get(row.id) ?? [];
      const chapter: Chapter = { slug: row.slug, title: row.title, lessons };
      const items = chaptersByCourse.get(row.course_id) ?? [];
      items.push(chapter);
      chaptersByCourse.set(row.course_id, items);
    }

    const curriculum: LearningLevel[] = levels.map((level) => {
      const levelCourses = courses.filter((course) => course.learning_level_id === level.id);
      return {
        slug: level.slug,
        name: level.name,
        rank: level.rank,
        description: level.description,
        courseTitle: levelCourses.map((course) => course.title).join(" · "),
        chapters: levelCourses.flatMap((course) => chaptersByCourse.get(course.id) ?? []),
      };
    });

    return { status: "ready", curriculum };
  } catch {
    return { status: "error", reason: "unavailable" };
  }
}
