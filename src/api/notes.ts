import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import fs from 'fs/promises'

const filePath = 'notes-file.json'

export type Note = {
  id: number
  title: string
  body?: string
  favorite: boolean
}

// Helper functions for file operations
export async function readNotes(): Promise<Note[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    const initial: Note[] = []
    await writeNotes(initial)
    return initial
  }
}

export async function writeNotes(notes: Note[]) {
  await fs.writeFile(filePath, JSON.stringify(notes, null, 2), 'utf-8')
}

// Server function to get all notes
export const getAllNotes = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching all notes...')
    const notes = await readNotes()
    return notes
  },
)

// Server function to get a single note by ID
export const getNoteById = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    console.info(`Fetching note with id ${id}...`)
    const notes = await readNotes()
    const note = notes.find((n) => n.id === id)

    if (!note) {
      throw notFound()
    }

    return note
  })

// Server function to create a new note
export const createNote = createServerFn({ method: 'POST' })
  .inputValidator((data: { title: string; body?: string }) => data)
  .handler(async ({ data }) => {
    console.info('Creating new note...')
    const notes = await readNotes()

    // Generate new ID (max existing ID + 1, or 1 if no notes)
    const maxId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) : 0
    const newNote: Note = {
      id: maxId + 1,
      title: data.title,
      body: data.body,
      favorite: false,
    }

    notes.push(newNote)
    await writeNotes(notes)

    return newNote
  })

// Server function to update an existing note
export const updateNote = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; updates: Partial<Note> }) => data)
  .handler(async ({ data }) => {
    console.info(`Updating note with id ${data.id}...`)
    const notes = await readNotes()
    const index = notes.findIndex((n) => n.id === data.id)

    if (index === -1) {
      throw notFound()
    }

    // Merge updates with existing note
    notes[index] = { ...notes[index], ...data.updates }
    await writeNotes(notes)

    return notes[index]
  })

// Server function to delete a note
export const deleteNote = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    console.info(`Deleting note with id ${id}...`)
    const notes = await readNotes()
    const index = notes.findIndex((n) => n.id === id)

    if (index === -1) {
      throw notFound()
    }

    notes.splice(index, 1)
    await writeNotes(notes)

    return { success: true }
  })
