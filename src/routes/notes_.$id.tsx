import {
  ErrorComponent,
  Link,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { noteByIdQueryOptions } from '../utils/notes'
import { updateNote, deleteNote } from '../api/notes'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { NotFound } from '~/components/NotFound'
import { useState } from 'react'

export const Route = createFileRoute('/notes_/$id')({
  loader: async ({ params: { id }, context }) => {
    const noteId = parseInt(id)
    const data = await context.queryClient.ensureQueryData(
      noteByIdQueryOptions(noteId),
    )

    return {
      title: data.title,
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: loaderData.title }] : undefined,
  }),
  errorComponent: NoteErrorComponent,
  notFoundComponent: () => {
    return <NotFound>Note not found</NotFound>
  },
  component: NoteComponent,
})

export function NoteErrorComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function NoteComponent() {
  const { id } = Route.useParams()
  const noteId = parseInt(id)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const noteQuery = useSuspenseQuery(noteByIdQueryOptions(noteId))

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(noteQuery.data.title)
  const [editContent, setEditContent] = useState(noteQuery.data.content || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: (updates: { title?: string; content?: string; favorite?: boolean }) =>
      updateNote({ data: { id: noteId, updates } }),
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notes', noteId] })

      // Snapshot the previous value
      const previousNote = queryClient.getQueryData(['notes', noteId])

      // Optimistically update to the new value
      queryClient.setQueryData(['notes', noteId], (old: any) => ({
        ...old,
        ...updates,
      }))

      // Return context with the previous value
      return { previousNote }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNote) {
        queryClient.setQueryData(['notes', noteId], context.previousNote)
      }
    },
    onSuccess: () => {
      // Invalidate notes list to refresh
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setIsEditing(false)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteNote({ data: noteId }),
    onSuccess: () => {
      // Invalidate notes list
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      // Navigate back to list
      navigate({ to: '/notes' })
    },
  })

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateMutation.mutate({
        title: editTitle.trim(),
        content: editContent.trim() || undefined,
      })
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(noteQuery.data.title)
    setEditContent(noteQuery.data.content || '')
    setIsEditing(false)
  }

  const handleToggleFavorite = () => {
    updateMutation.mutate({
      favorite: !noteQuery.data.favorite,
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Link
        to="/notes"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to Notes
      </Link>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        {/* Header with favorite toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-3xl font-bold border-b-2 border-blue-500 focus:outline-none flex-1"
                autoFocus
              />
            ) : (
              <h1 className="text-3xl font-bold">{noteQuery.data.title}</h1>
            )}
            <button
              onClick={handleToggleFavorite}
              disabled={updateMutation.isPending}
              className="text-2xl hover:scale-110 transition"
              title={noteQuery.data.favorite ? 'Unfavorite' : 'Favorite'}
            >
              {noteQuery.data.favorite ? '★' : '☆'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note content"
              rows={8}
            />
          ) : (
            <div className="text-gray-700 whitespace-pre-wrap">
              {noteQuery.data.content || (
                <em className="text-gray-400">No content</em>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
          )}

          <div className="flex-1" />

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          ) : (
            <div className="flex gap-2">
              <span className="px-3 py-2 text-sm text-gray-700">
                Are you sure?
              </span>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Error messages */}
        {updateMutation.isError && (
          <div className="text-red-600 text-sm">
            Error updating note: {(updateMutation.error as Error).message}
          </div>
        )}
        {deleteMutation.isError && (
          <div className="text-red-600 text-sm">
            Error deleting note: {(deleteMutation.error as Error).message}
          </div>
        )}
      </div>
    </div>
  )
}
