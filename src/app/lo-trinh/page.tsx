import { LevelCatalog } from "@/features/curriculum/progress-ui";
import { CurriculumFeedback } from "@/features/curriculum/curriculum-feedback";
import { loadCurriculum } from "@/features/curriculum/data/repository";

export default async function LearningPathPage() {
  const result = await loadCurriculum();
  if (result.status !== "ready") return <CurriculumFeedback result={result} heading="Lộ trình học" />;
  return <LevelCatalog curriculum={result.curriculum} />;
}
