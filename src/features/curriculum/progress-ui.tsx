"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { findLesson, getLessons, lessonsInLevel } from "./data";
import { getProgressServerSnapshot, getProgressSnapshot, subscribeToProgress } from "./progress-store";
import type { LearningLevel, LearningProgress, LessonStatus } from "./types";

export function useLearningProgress() {
  return useSyncExternalStore(subscribeToProgress, getProgressSnapshot, getProgressServerSnapshot);
}

export function getLessonStatus(progress: LearningProgress, slug: string): LessonStatus {
  return progress.lessons[slug]?.status ?? "not_started";
}

export function getLevelProgress(level: LearningLevel, progress: LearningProgress) {
  const levelLessons = lessonsInLevel(level);
  const completed = levelLessons.filter((lesson) => getLessonStatus(progress, lesson.slug) === "completed").length;
  const inProgress = levelLessons.filter((lesson) => getLessonStatus(progress, lesson.slug) === "in_progress").length;
  return {
    total: levelLessons.length,
    completed,
    inProgress,
    percent: levelLessons.length ? Math.round((completed / levelLessons.length) * 100) : 0,
  };
}

export function StatusBadge({ status }: { status: LessonStatus }) {
  const label = status === "completed" ? "Hoàn thành" : status === "in_progress" ? "Đang học" : "Chưa học";
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="curriculum-progress">
      <div className="curriculum-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span className="curriculum-progress-value" style={{ width: `${percent}%` }} />
      </div>
      <span className="curriculum-progress-label">{percent}%</span>
    </div>
  );
}

export function LevelCatalog({ curriculum }: { curriculum: LearningLevel[] }) {
  const progress = useLearningProgress();
  const done = Object.values(progress.lessons).filter((item) => item.status === "completed").length;
  const lessonCount = getLessons(curriculum).length;

  return (
    <main className="content curriculum-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Giáo trình Python</p>
          <h1>Lộ trình học</h1>
          <p className="page-subtitle">Học tuần tự từ cú pháp nền tảng đến cách xây dựng dự án Python hoàn chỉnh.</p>
        </div>
      </div>
      <p className="curriculum-storage-note">Tiến độ hiện được lưu trên thiết bị này; nội dung giáo trình được tải từ Supabase.</p>
      <div className="level-grid">
        {curriculum.map((level) => {
          const metrics = getLevelProgress(level, progress);
          const levelStatus: LessonStatus = metrics.completed === metrics.total ? "completed" : metrics.completed + metrics.inProgress > 0 ? "in_progress" : "not_started";
          return (
            <article className="card level-card" key={level.slug}>
              <div className="level-card-top">
                <span className="level-number">0{level.rank}</span>
                <StatusBadge status={levelStatus} />
              </div>
              <h2>{level.name}</h2>
              <p>{level.description}</p>
              <div className="level-card-meta">
                <span>{level.chapters.length} chương</span><span aria-hidden="true">·</span><span>{metrics.total} bài học</span>
              </div>
              <ProgressBar percent={metrics.percent} label={`Tiến độ cấp độ ${level.name}`} />
              <Link className="button-secondary level-card-action" href={`/lo-trinh/${level.slug}`}>
                Mở cấp độ <span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>
      <p className="curriculum-total">Tổng tiến độ giáo trình: <strong>{done} / {lessonCount}</strong> bài đã hoàn thành.</p>
    </main>
  );
}

export function LevelDetail({ level }: { level: LearningLevel }) {
  const progress = useLearningProgress();
  const metrics = getLevelProgress(level, progress);
  const levelStatus: LessonStatus = metrics.completed === metrics.total ? "completed" : metrics.completed + metrics.inProgress > 0 ? "in_progress" : "not_started";

  return (
    <main className="content curriculum-page">
      <div className="page-heading">
        <div>
          <Link className="curriculum-back-link" href="/lo-trinh">← Tất cả cấp độ</Link>
          <p className="eyebrow">Cấp độ 0{level.rank}</p>
          <h1>{level.name}: {level.courseTitle}</h1>
          <p className="page-subtitle">{level.description}</p>
        </div>
        <StatusBadge status={levelStatus} />
      </div>
      <section className="card level-progress-card" aria-label="Tiến độ cấp độ">
        <div><strong>{metrics.completed} / {metrics.total}</strong><span>bài học hoàn thành</span></div>
        <ProgressBar percent={metrics.percent} label={`Tiến độ cấp độ ${level.name}`} />
      </section>
      <div className="chapter-list">
        {level.chapters.map((chapter, chapterIndex) => {
          const completed = chapter.lessons.filter((lesson) => getLessonStatus(progress, lesson.slug) === "completed").length;
          const chapterPercent = chapter.lessons.length ? Math.round((completed / chapter.lessons.length) * 100) : 0;
          return (
            <section className="card chapter-card" key={chapter.slug}>
              <div className="chapter-heading">
                <span className="chapter-index">Chương {chapterIndex + 1}</span>
                <h2>{chapter.title}</h2>
                <span className="chapter-count">{completed}/{chapter.lessons.length} bài · {chapterPercent}%</span>
              </div>
              <ol className="lesson-list">
                {chapter.lessons.map((lesson, lessonIndex) => {
                  const status = getLessonStatus(progress, lesson.slug);
                  return (
                    <li key={lesson.slug}>
                      <Link className="lesson-list-item" href={`/hoc/${lesson.slug}`}>
                        <span className={`lesson-index${status === "completed" ? " is-complete" : ""}`}>{status === "completed" ? "✓" : `${chapterIndex + 1}.${lessonIndex + 1}`}</span>
                        <span className="lesson-list-copy"><strong>{lesson.title}</strong><span>{lesson.minutes} phút</span></span>
                        <StatusBadge status={status} />
                        <span className="lesson-chevron" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </main>
  );
}

export function ProgressOverview({ lessonCount }: { lessonCount: number }) {
  const progress = useLearningProgress();
  const completed = Object.values(progress.lessons).filter((item) => item.status === "completed").length;
  const active = Object.values(progress.lessons).filter((item) => item.status === "in_progress").length;
  const percent = lessonCount ? Math.round((completed / lessonCount) * 100) : 0;
  return (
    <div className="stats-grid curriculum-stats" aria-label="Tiến độ học Python">
      <article className="card stat-card"><div className="stat-icon" aria-hidden="true">✓</div><div><p>Bài đã hoàn thành</p><strong>{completed}<span> / {lessonCount}</span></strong></div></article>
      <article className="card stat-card"><div className="stat-icon" aria-hidden="true">◷</div><div><p>Bài đang học</p><strong>{active}</strong></div></article>
      <article className="card stat-card"><div className="stat-icon" aria-hidden="true">↗</div><div><p>Tiến độ giáo trình</p><strong>{percent}%</strong></div></article>
    </div>
  );
}

export function ResumeLessonCard({ curriculum }: { curriculum: LearningLevel[] }) {
  const progress = useLearningProgress();
  const lastLesson = progress.lastLessonSlug ? findLesson(curriculum, progress.lastLessonSlug) : undefined;
  const firstLesson = curriculum[0]?.chapters[0]?.lessons[0];
  const lesson = lastLesson?.lesson ?? firstLesson;
  if (!lesson) return null;
  const status = getLessonStatus(progress, lesson.slug);
  const heading = lastLesson ? "Tiếp tục bài học gần nhất" : "Bắt đầu hành trình học";
  const action = lastLesson ? "Tiếp tục bài học" : "Mở bài học đầu tiên";
  return (
    <section className="card resume-card">
      <div className="resume-card-copy">
        <span className="resume-kicker">{heading}</span>
        <h2>{lesson.title}</h2>
        <p>{lastLesson ? `${lastLesson.level.name} · ${lastLesson.chapter.title}` : `${curriculum[0].name} · ${curriculum[0].chapters[0].title}`}</p>
      </div>
      <div className="resume-card-action">
        <StatusBadge status={status} />
        <Link className="button-primary" href={`/hoc/${lesson.slug}`}>{action} <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
