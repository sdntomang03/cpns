import { getDatabase } from '../sqlite';
import { serializeDatabaseWrite } from '../writeQueue';

export function getPracticePackages(category = '') {
  return getDatabase().then(async (db) => {
    const result = category
      ? await db.query(
          'SELECT content FROM practice_packages WHERE category = ? ORDER BY title',
          [category],
        )
      : await db.query('SELECT content FROM practice_packages ORDER BY category, title');

    return (result.values || []).map(({ content }) => normalizeCachedPackage(JSON.parse(content)));
  });
}

function normalizeCachedPackage(practicePackage) {
  const legacyRules = {
    'twk-paket-1': { oldWeight: 20, weight: 5, passingScore: 11 },
    'twk-paket-2': { oldWeight: 20, weight: 5, passingScore: 11 },
    'tiu-paket-1': { oldWeight: 20, weight: 5, passingScore: 12 },
    'tiu-paket-2': { oldWeight: 20, weight: 5, passingScore: 12 },
    'tkp-paket-1': { oldWeight: 8, weight: 1, passingScore: 19 },
    'tkp-paket-2': { oldWeight: 8, weight: 1, passingScore: 19 },
  };
  const rules = legacyRules[practicePackage.slug];
  if (!rules || !practicePackage.questions.every((question) => question.weight === rules.oldWeight)) {
    return practicePackage;
  }

  const questions = practicePackage.questions.map((question) => ({
    ...question,
    weight: rules.weight,
  }));
  const maxScore = questions.reduce(
    (total, question) => total + question.weight * Math.max(...question.options.map((option) => option.score)),
    0,
  );

  return {
    ...practicePackage,
    questions,
    passing_score: rules.passingScore,
    max_score: maxScore,
  };
}

export function cachePracticePackages(packages) {
  return serializeDatabaseWrite(async () => {
    const db = await getDatabase();
    await db.beginTransaction();

    try {
      await db.run('DELETE FROM practice_packages', [], false);

      for (const practicePackage of packages) {
        await db.run(
          `INSERT INTO practice_packages (
            id, category, title, description, passing_score, max_score,
            question_count, content, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            category = excluded.category,
            title = excluded.title,
            description = excluded.description,
            passing_score = excluded.passing_score,
            max_score = excluded.max_score,
            question_count = excluded.question_count,
            content = excluded.content,
            updated_at = excluded.updated_at`,
          [
            practicePackage.id,
            practicePackage.category,
            practicePackage.title,
            practicePackage.description,
            practicePackage.passing_score,
            practicePackage.max_score,
            practicePackage.question_count,
            JSON.stringify(practicePackage),
            practicePackage.updated_at,
          ],
          false,
        );
      }

      await db.commitTransaction();
    } catch (error) {
      if ((await db.isTransactionActive()).result) {
        await db.rollbackTransaction();
      }
      throw error;
    }
  });
}

export function cachePracticePackage(practicePackage) {
  return serializeDatabaseWrite(async () => {
    const db = await getDatabase();
    await db.run(
      `INSERT INTO practice_packages (
        id, category, title, description, passing_score, max_score,
        question_count, content, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category = excluded.category,
        title = excluded.title,
        description = excluded.description,
        passing_score = excluded.passing_score,
        max_score = excluded.max_score,
        question_count = excluded.question_count,
        content = excluded.content,
        updated_at = excluded.updated_at`,
      [
        practicePackage.id,
        practicePackage.category,
        practicePackage.title,
        practicePackage.description,
        practicePackage.passing_score,
        practicePackage.max_score,
        practicePackage.question_count,
        JSON.stringify(practicePackage),
        practicePackage.updated_at,
      ],
      false,
    );
  });
}

export function savePracticeAttempt(attempt) {
  return serializeDatabaseWrite(async () => {
    const db = await getDatabase();
    await db.run(
      `INSERT INTO practice_attempts (
        uuid, user_id, package_slug, category, package_title, score, max_score,
        passing_score, correct_count, wrong_count, unanswered_count, passed,
        completed_at, synced, result_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        attempt.uuid,
        String(attempt.user_id),
        attempt.package_slug,
        attempt.category,
        attempt.package_title,
        attempt.score,
        attempt.max_score,
        attempt.passing_score,
        attempt.correct_count,
        attempt.wrong_count,
        attempt.unanswered_count,
        attempt.passed ? 1 : 0,
        attempt.completed_at,
        JSON.stringify(attempt),
      ],
      false,
    );
  });
}

export async function getPracticeAttempts(userId, limit = 10) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT * FROM practice_attempts
     WHERE user_id = ?
     ORDER BY completed_at DESC
     LIMIT ?`,
    [String(userId), limit],
  );

  return result.values || [];
}

export async function getPracticeSummary(userId) {
  const db = await getDatabase();
  const [summaryResult, latestResult] = await Promise.all([
    db.query(
      `SELECT
        COUNT(*) AS sessions,
        COALESCE(SUM(correct_count + wrong_count + unanswered_count), 0) AS questions,
        COALESCE(SUM(correct_count), 0) AS correct,
        COALESCE(SUM(wrong_count), 0) AS wrong,
        COALESCE(SUM(score), 0) AS total_score,
        COALESCE(SUM(max_score), 0) AS total_max_score
       FROM practice_attempts
       WHERE user_id = ?`,
      [String(userId)],
    ),
    db.query(
      `SELECT * FROM practice_attempts
       WHERE user_id = ?
       ORDER BY completed_at DESC
       LIMIT 1`,
      [String(userId)],
    ),
  ]);
  const summary = summaryResult.values?.[0] || {};

  return {
    sessions: Number(summary.sessions) || 0,
    questions: Number(summary.questions) || 0,
    correct: Number(summary.correct) || 0,
    wrong: Number(summary.wrong) || 0,
    total_score: Number(summary.total_score) || 0,
    total_max_score: Number(summary.total_max_score) || 0,
    score_progress: summary.total_max_score
      ? Math.round((summary.total_score / summary.total_max_score) * 1000) / 10
      : 0,
    latest: latestResult.values?.[0] || null,
  };
}

export async function getPracticeStatistics(userId, limit = 20) {
  const db = await getDatabase();
  const [summaryResult, categoryResult, attemptsResult] = await Promise.all([
    db.query(
      `SELECT
        COUNT(*) AS sessions,
        COALESCE(SUM(score), 0) AS total_score,
        COALESCE(SUM(max_score), 0) AS total_max_score,
        COALESCE(MAX(score), 0) AS best_score
       FROM practice_attempts
       WHERE user_id = ?`,
      [String(userId)],
    ),
    db.query(
      `SELECT
        category,
        COUNT(*) AS sessions,
        COALESCE(SUM(score), 0) AS total_score,
        COALESCE(SUM(max_score), 0) AS total_max_score,
        COALESCE(MAX(score), 0) AS best_score
       FROM practice_attempts
       WHERE user_id = ?
       GROUP BY category
       ORDER BY category`,
      [String(userId)],
    ),
    db.query(
      `SELECT * FROM practice_attempts
       WHERE user_id = ?
       ORDER BY completed_at DESC
       LIMIT ?`,
      [String(userId), limit],
    ),
  ]);
  const summary = summaryResult.values?.[0] || {};
  const categories = (categoryResult.values || []).map((item) => ({
    ...item,
    sessions: Number(item.sessions) || 0,
    total_score: Number(item.total_score) || 0,
    total_max_score: Number(item.total_max_score) || 0,
    best_score: Number(item.best_score) || 0,
    score_progress: item.total_max_score
      ? Math.round((item.total_score / item.total_max_score) * 1000) / 10
      : 0,
  }));

  return {
    sessions: Number(summary.sessions) || 0,
    total_score: Number(summary.total_score) || 0,
    total_max_score: Number(summary.total_max_score) || 0,
    best_score: Number(summary.best_score) || 0,
    score_progress: summary.total_max_score
      ? Math.round((summary.total_score / summary.total_max_score) * 1000) / 10
      : 0,
    categories,
    attempts: (attemptsResult.values || []).map((attempt) => ({
      ...attempt,
      result: JSON.parse(attempt.result_json),
    })),
  };
}

export async function getPendingPracticeAttempts(userId, limit = 50) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT result_json FROM practice_attempts
     WHERE user_id = ? AND synced = 0
     ORDER BY completed_at
     LIMIT ?`,
    [String(userId), limit],
  );

  return (result.values || []).map(({ result_json: resultJson }) => JSON.parse(resultJson));
}

export function markPracticeAttemptsSynced(uuids) {
  if (!uuids.length) {
    return Promise.resolve();
  }

  return serializeDatabaseWrite(async () => {
    const db = await getDatabase();
    const placeholders = uuids.map(() => '?').join(', ');
    await db.run(
      `UPDATE practice_attempts SET synced = 1 WHERE uuid IN (${placeholders})`,
      uuids,
      false,
    );
  });
}
