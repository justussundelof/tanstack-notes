import { queryOptions } from '@tanstack/react-query'
import { getAllNotes, getNoteById } from '../api/notes'

// Query options for fetching all notes
export const notesListQueryOptions = () =>
  queryOptions({
    queryKey: ['notes'],
    queryFn: () => getAllNotes(),
  })

// Query options for fetching a single note by ID
export const noteByIdQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['notes', id],
    queryFn: () => getNoteById({ data: id }),
  })
