"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getAdjacentLessons } from "./data";
import { markLessonCompleted, recordLessonOpened } from "./progress-store";
import { getLessonStatus, StatusBadge, useLearningProgress } from "./progress-ui";
import type { LearningLevel, Lesson } from "./types";

function LessonNavigation({ level, lesson }: { level: LearningLevel; lesson: Lesson }) {
  return (
    <nav className="lesson-toc" aria-label="Nội dung cấp độ">
      <div className="lesson-toc-heading">
        <span className="eyebrow">Cấp độ {String(level.rank).padStart(2, "0")}</span>
        <strong>{level.name}</strong>
      </div>
      {level.chapters.map((chapter, chapterIndex) => (
        <section className="lesson-toc-chapter" key={chapter.slug}>
          <h2>{chapterIndex + 1}. {chapter.title}</h2>
          <ul>
            {chapter.lessons.map((item) => (
              <li key={item.slug}>
                <Link className={`lesson-toc-link${item.slug === lesson.slug ? " active" : ""}`} href={`/hoc/${item.slug}`} aria-current={item.slug === lesson.slug ? "page" : undefined}>
                  <span className="toc-dot" aria-hidden="true" />
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export function LessonScreen({ level, chapter, lesson, curriculum }: { level: LearningLevel; chapter: LearningLevel["chapters"][number]; lesson: Lesson; curriculum: LearningLevel[] }) {
  const progress = useLearningProgress();
  const status = getLessonStatus(progress, lesson.slug);
  const { previous, next } = getAdjacentLessons(curriculum, lesson.slug);
  const currentChapterIndex = level.chapters.findIndex((item) => item.slug === chapter.slug);
  const lessonIndex = chapter.lessons.findIndex((item) => item.slug === lesson.slug);
  const lessonNumber = level.chapters.slice(0, currentChapterIndex).reduce((count, item) => count + item.lessons.length, 0) + lessonIndex + 1;

  useEffect(() => {
    recordLessonOpened(lesson.slug);
  }, [lesson.slug]);

  return (
    <main className="content lesson-page">
      <div className="lesson-crumbs">
        <Link href="/lo-trinh">Lộ trình</Link><span aria-hidden="true">/</span>
        <Link href={`/lo-trinh/${level.slug}`}>{level.name}</Link><span aria-hidden="true">/</span>
        <span>{chapter.title}</span>
      </div>
      <details className="lesson-mobile-toc">
        <summary>Danh sách chương và bài học</summary>
        <LessonNavigation level={level} lesson={lesson} />
      </details>
      <div className="lesson-layout">
        <LessonNavigation level={level} lesson={lesson} />
        <article className="lesson-content">
          <header className="lesson-heading">
            <div className="lesson-heading-meta"><span>Bài {String(lessonNumber).padStart(2, "0")}</span><span>{lesson.minutes} phút</span><StatusBadge status={status} /></div>
            <p className="eyebrow">{level.name} · {chapter.title}</p>
            <h1>{lesson.title}</h1>
            <p className="page-subtitle">Hoàn thành bài học theo từng phần, thử chạy ví dụ trong Python và tự đánh giá bằng bài tập cuối bài.</p>
          </header>

          <section className="lesson-section lesson-objectives">
            <h2>Mục tiêu cần đạt</h2>
            <ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="lesson-section">
            <h2>Kiến thức lý thuyết</h2>
            {lesson.theory.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>

          <section className="lesson-section">
            <h2>Ví dụ Python</h2>
            <pre className="lesson-code"><code>{lesson.code}</code></pre>
            <h3>Phân tích ví dụ</h3>
            <p>{lesson.explanation}</p>
            <h3>Kết quả</h3>
            <pre className="lesson-output"><code>{lesson.output}</code></pre>
          </section>

          <section className="lesson-section lesson-mistakes">
            <h2>Lỗi thường gặp</h2>
            <ul>{lesson.mistakes.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="lesson-section lesson-summary">
            <h2>Tóm tắt kiến thức</h2>
            <ul>{lesson.summary.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="lesson-section lesson-exercises">
            <h2>Bài tập củng cố</h2>
            <p>Hãy tự viết lời giải trước khi xem lại phần lý thuyết. Bài tập hiện chưa được chấm tự động.</p>
            <ol>{lesson.exercises.map((item) => <li key={item}>{item}</li>)}</ol>
          </section>

          <div className="lesson-completion">
            <div><strong>{status === "completed" ? "Bạn đã hoàn thành bài học này." : "Đánh dấu khi bạn đã học xong."}</strong><span>Trạng thái chỉ thay đổi khi bạn chọn nút bên cạnh.</span></div>
            <button className="button-primary" type="button" onClick={() => markLessonCompleted(lesson.slug)} disabled={status === "completed"}>
              {status === "completed" ? "Đã hoàn thành ✓" : "Đánh dấu hoàn thành"}
            </button>
          </div>

          <nav className="lesson-pager" aria-label="Điều hướng bài học">
            {previous ? <Link className="button-secondary" href={`/hoc/${previous.slug}`}><span aria-hidden="true">←</span> {previous.title}</Link> : <span />}
            {next ? <Link className="button-primary" href={`/hoc/${next.slug}`}>{next.title} <span aria-hidden="true">→</span></Link> : <Link className="button-secondary" href={`/lo-trinh/${level.slug}`}>Về cấp độ</Link>}
          </nav>
        </article>
      </div>
      <aside className="lesson-data-note">Tiến độ đang được lưu trên trình duyệt này; nội dung chưa được đồng bộ lên Supabase.</aside>
    </main>
  );
}
