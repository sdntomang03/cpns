import { getDatabase } from '../sqlite';
import { serializeDatabaseWrite } from '../writeQueue';

export async function getMaterials(category) {
  const db = await getDatabase();
  const query = category
    ? await db.query(
        'SELECT * FROM materials WHERE category = ? ORDER BY sort_order, title',
        [category],
      )
    : await db.query('SELECT * FROM materials ORDER BY category, sort_order, title');

  return query.values || [];
}

export async function getMaterialBySlug(slug) {
  const db = await getDatabase();
  const query = await db.query('SELECT * FROM materials WHERE slug = ?', [slug]);

  return query.values?.[0] || null;
}

export function cacheMaterials(materials) {
  return serializeDatabaseWrite(async () => {
    const db = await getDatabase();
    await db.beginTransaction();

    try {
      for (const material of materials) {
        if (material.deleted_at || !material.is_published) {
          await db.run('DELETE FROM materials WHERE id = ?', [material.id], false);
          continue;
        }

        await db.run(
          `INSERT INTO materials (
          id, category, category_name, title, slug, content, thumbnail, sort_order, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          category = excluded.category,
          category_name = excluded.category_name,
          title = excluded.title,
          slug = excluded.slug,
          content = excluded.content,
          thumbnail = excluded.thumbnail,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at`,
          [
            material.id,
            material.category || '',
            material.category_name || '',
            material.title,
            material.slug,
            material.content || '',
            material.thumbnail,
            material.order || 0,
            material.updated_at,
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

export async function getMetadata(key) {
  const db = await getDatabase();
  const result = await db.query('SELECT value FROM app_metadata WHERE key = ?', [key]);

  return result.values?.[0]?.value || null;
}

export function setMetadata(key, value) {
  return serializeDatabaseWrite(async () => {
    const db = await getDatabase();
    await db.run(
      `INSERT INTO app_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
      false,
    );
  });
}
