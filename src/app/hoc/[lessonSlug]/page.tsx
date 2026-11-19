import { notFound } from "next/navigation";
import { LessonScreen } from "@/features/curriculum/lesson-screen";
import { findLesson } from "@/features/curriculum/data";
import { loadCurriculum } from "@/features/curriculum/data/repository";
import { CurriculumFeedback } from "@/features/curriculum/curriculum-feedback";

export default async function LessonPage({ params }: { params: Promise<{ lessonSlug: string }> }) {
  const { lessonSlug } = await params;
  const result = await loadCurriculum();
  if (result.status !== "ready") return <CurriculumFeedback result={result} heading="Bài học" />;
  const match = findLesson(result.curriculum, lessonSlug);
  if (!match) notFound();
  return <LessonScreen level={match.level} chapter={match.chapter} lesson={match.lesson} curriculum={result.curriculum} />;
}
