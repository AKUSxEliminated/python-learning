import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src/features/curriculum/data/curriculum.json");
const outputPath = path.join(root, "supabase/seed.sql");
const levels = JSON.parse(await readFile(sourcePath, "utf8"));
const sqlText = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sqlJson = (value) => `${sqlText(JSON.stringify(value))}::jsonb`;
const statements = [
  "-- Generated from src/features/curriculum/data/curriculum.json. Do not edit by hand.",
  "begin;",
];

for (const level of levels) {
  statements.push(
    `insert into public.learning_levels (slug, name, rank, description) values (${sqlText(level.slug)}, ${sqlText(level.name)}, ${level.rank}, ${sqlText(level.description)}) on conflict (slug) do update set name = excluded.name, rank = excluded.rank, description = excluded.description, updated_at = now();`,
  );
}

for (const level of levels) {
  const courseSlug = `python-${level.slug}`;
  statements.push(
    `insert into public.courses (learning_level_id, slug, title) select id, ${sqlText(courseSlug)}, ${sqlText(level.courseTitle)} from public.learning_levels where slug = ${sqlText(level.slug)} on conflict (slug) do update set learning_level_id = excluded.learning_level_id, title = excluded.title, updated_at = now();`,
  );
  level.chapters.forEach((chapter, chapterIndex) => {
    statements.push(
      `insert into public.chapters (course_id, slug, title, position) select id, ${sqlText(chapter.slug)}, ${sqlText(chapter.title)}, ${chapterIndex + 1} from public.courses where slug = ${sqlText(courseSlug)} on conflict (course_id, slug) do update set title = excluded.title, position = excluded.position, updated_at = now();`,
    );
    chapter.lessons.forEach((lesson, lessonIndex) => {
      const content = {
        objectives: lesson.objectives,
        theory: lesson.theory,
        code: lesson.code,
        explanation: lesson.explanation,
        output: lesson.output,
        mistakes: lesson.mistakes,
        summary: lesson.summary,
        exercises: lesson.exercises,
      };
      statements.push(
        `insert into public.lessons (chapter_id, slug, title, position, estimated_minutes, content) select id, ${sqlText(lesson.slug)}, ${sqlText(lesson.title)}, ${lessonIndex + 1}, ${lesson.minutes}, ${sqlJson(content)} from public.chapters where course_id = (select id from public.courses where slug = ${sqlText(courseSlug)}) and slug = ${sqlText(chapter.slug)} on conflict (chapter_id, slug) do update set title = excluded.title, position = excluded.position, estimated_minutes = excluded.estimated_minutes, content = excluded.content, updated_at = now();`,
      );
    });
  });
}

statements.push("commit;", "");
await writeFile(outputPath, statements.join("\n\n"), "utf8");
console.log(`Wrote ${outputPath} with ${levels.length} levels and ${levels.reduce((sum, level) => sum + level.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.lessons.length, 0), 0)} lessons.`);
