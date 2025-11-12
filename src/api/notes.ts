import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '../db'
import { notes, type Note, type NewNote } from '../db/schema'
import { eq } from 'drizzle-orm'

// Server function to get all notes
export const getAllNotes = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching all notes...')
    const allNotes = await db.select().from(notes).orderBy(notes.createdAt)
    return allNotes
  },
)

// Server function to get a single note by ID
export const getNoteById = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    console.info(`Fetching note with id ${id}...`)
    const [note] = await db.select().from(notes).where(eq(notes.id, id))

    if (!note) {
      throw notFound()
    }

    return note
  })

// Server function to create a new note
export const createNote = createServerFn({ method: 'POST' })
  .inputValidator((data: { title: string; content?: string }) => data)
  .handler(async ({ data }) => {
    console.info('Creating new note...')

    const [result] = await db.insert(notes).values({
      title: data.title,
      content: data.content || null,
      favorite: false,
    })

    // Fetch and return the newly created note
    const [newNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, result.insertId))

    return newNote
  })

// Server function to update an existing note
export const updateNote = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: number
      updates: Partial<Pick<Note, 'title' | 'content' | 'favorite'>>
    }) => data,
  )
  .handler(async ({ data }) => {
    console.info(`Updating note with id ${data.id}...`)

    await db.update(notes).set(data.updates).where(eq(notes.id, data.id))

    // Fetch and return the updated note
    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, data.id))

    if (!updatedNote) {
      throw notFound()
    }

    return updatedNote
  })

// Server function to delete a note
export const deleteNote = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    console.info(`Deleting note with id ${id}...`)

    await db.delete(notes).where(eq(notes.id, id))

    return { success: true }
  })

// Export types for use in other files
export type { Note, NewNote }
