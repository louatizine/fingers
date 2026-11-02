import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { commentAPI } from '../services/api'
import { useToast } from './Toast'

export default function RequestComments({ entityType, entityId, compact = false }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [open, setOpen] = useState(!compact)
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!entityId) return
    setLoading(true)
    try {
      const response = await commentAPI.getComments(entityType, entityId)
      setComments(response.data.comments || [])
    } catch (error) {
      toast.error(error.response?.data?.error || t('comments.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open, entityType, entityId])

  const submit = async (event) => {
    event.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    try {
      await commentAPI.postComment(entityType, entityId, body.trim())
      setBody('')
      await load()
      toast.success(t('comments.posted'))
    } catch (error) {
      toast.error(error.response?.data?.error || t('comments.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-700"
      >
        <span>{t('comments.title')} {comments.length ? `(${comments.length})` : ''}</span>
        <span className="text-xs text-slate-400">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-3">
          {loading && <p className="text-xs text-slate-500">{t('common.loading')}</p>}
          {!loading && !comments.length && <p className="text-xs text-slate-500">{t('comments.empty')}</p>}
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {comments.map((comment) => (
              <li key={comment._id} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">{comment.authorName}</span>
                  <span className="text-[11px] text-slate-400">{comment.createdAt?.slice?.(0, 16)?.replace('T', ' ')}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-600">{comment.body}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={submit} className="space-y-2">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={2}
              placeholder={t('comments.placeholder')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex justify-end">
              <button type="submit" disabled={saving || !body.trim()} className="btn-primary text-xs disabled:opacity-50">
                {saving ? t('common.saving') : t('comments.post')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
