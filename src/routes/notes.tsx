import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { notesListQueryOptions } from '../utils/notes'
import { createNote } from '../api/notes'
import { useState } from 'react'

export const Route = createFileRoute('/notes')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(notesListQueryOptions())
  },
  head: () => ({
    meta: [{ title: 'Notes' }],
  }),
  component: NotesComponent,
})

function NotesComponent() {
  const queryClient = useQueryClient()
  const notesQuery = useSuspenseQuery(notesListQueryOptions())
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // Mutation for creating a new note
  const createMutation = useMutation({
    mutationFn: (data: { title: string; content?: string }) =>
      createNote({ data }),
    onSuccess: () => {
      // Invalidate and refetch notes list
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      // Clear form
      setTitle('')
      setContent('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim() || undefined,
      })
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">My Notes</h1>

        {/* Create Note Form */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-3">Create New Note</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter note title"
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter note content (optional)"
                rows={4}
                disabled={createMutation.isPending}
              />
            </div>
            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Note'}
            </button>
            {createMutation.isError && (
              <div className="text-red-600 text-sm">
                Error creating note: {(createMutation.error as Error).message}
              </div>
            )}
          </form>
        </div>

        {/* Notes List */}
        <div>
          <h2 className="text-xl font-semibold mb-3">All Notes</h2>
          {notesQuery.data.length === 0 ? (
            <p className="text-gray-500">No notes yet. Create your first note above!</p>
          ) : (
            <ul className="space-y-2">
              {notesQuery.data.map((note) => (
                <li
                  key={note.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <Link
                    to="/notes/$id"
                    params={{ id: note.id.toString() }}
                    className="block"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-blue-600 hover:text-blue-800">
                        {note.title}
                      </span>
                      {note.favorite && (
                        <span className="text-yellow-500">★</span>
                      )}
                    </div>
                    {note.content && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {note.content}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
