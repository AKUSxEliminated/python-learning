import { notFound } from "next/navigation";
import { LevelDetail } from "@/features/curriculum/progress-ui";
import { findLevel } from "@/features/curriculum/data";
import { loadCurriculum } from "@/features/curriculum/data/repository";
import { CurriculumFeedback } from "@/features/curriculum/curriculum-feedback";

export default async function LevelPage({ params }: { params: Promise<{ levelSlug: string }> }) {
  const { levelSlug } = await params;
  const result = await loadCurriculum();
  if (result.status !== "ready") return <CurriculumFeedback result={result} heading="Chi tiết cấp độ" />;
  const level = findLevel(result.curriculum, levelSlug);
  if (!level) notFound();
  return <LevelDetail level={level} />;
}
