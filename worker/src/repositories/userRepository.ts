export async function ensureUser(db: D1Database, id: string, type: 'guest' | 'authenticated' = 'guest'): Promise<void> {
	await db.prepare(`
		INSERT INTO users (id, type)
		VALUES (?, ?)
		ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
	`).bind(id, type).run();
}
