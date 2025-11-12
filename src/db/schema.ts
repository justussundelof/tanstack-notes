import { mysqlTable, int, varchar, text, timestamp, boolean } from 'drizzle-orm/mysql-core';

export const notes = mysqlTable('notes', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  favorite: boolean('favorite').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
