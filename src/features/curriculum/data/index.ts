import type { LearningLevel, Lesson } from "../types";

export function getLessons(curriculum: LearningLevel[]): Lesson[] {
  return curriculum.flatMap((level) =>
  level.chapters.flatMap((chapter) => chapter.lessons),
  );
}

export function findLevel(curriculum: LearningLevel[], slug: string) {
  return curriculum.find((level) => level.slug === slug);
}

export function findLesson(curriculum: LearningLevel[], slug: string) {
  for (const level of curriculum) {
    for (const chapter of level.chapters) {
      const lesson = chapter.lessons.find((item) => item.slug === slug);
      if (lesson) return { level, chapter, lesson };
    }
  }
  return undefined;
}

export function getAdjacentLessons(curriculum: LearningLevel[], slug: string) {
  const lessons = getLessons(curriculum);
  const index = lessons.findIndex((lesson) => lesson.slug === slug);
  return {
    previous: index > 0 ? lessons[index - 1] : undefined,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined,
  };
}

export function lessonsInLevel(level: LearningLevel): Lesson[] {
  return level.chapters.flatMap((chapter) => chapter.lessons);
}
