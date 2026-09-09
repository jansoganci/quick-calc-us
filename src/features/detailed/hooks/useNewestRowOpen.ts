import { useEffect, useRef, useState } from 'react'

/**
 * Below `lg` a repeating row is a collapsed summary that opens in place; a
 * row the user has just added opens itself, because they added it in order
 * to fill it in. From `lg` up every row is always open and this state is
 * inert.
 *
 * Adding a row also scrolls it into view and focuses its first field —
 * `rowRef` attaches to each row's container so the newest one can be found
 * once React has actually made it visible (a `display:none` row cannot take
 * focus).
 */
export function useNewestRowOpen(ids: readonly string[]) {
  const [openId, setOpenId] = useState<string | null>(ids[0] ?? null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const previousCount = useRef(ids.length)
  const nodes = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (ids.length > previousCount.current) {
      const newestId = ids[ids.length - 1] ?? null
      setOpenId(newestId)
      setFocusId(newestId)
    }
    previousCount.current = ids.length
  }, [ids])

  useEffect(() => {
    if (focusId === null) return
    const node = nodes.current.get(focusId)
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    node?.querySelector<HTMLElement>('input, textarea')?.focus()
    setFocusId(null)
  }, [focusId, openId])

  return {
    openId,
    isOpen: (id: string) => openId === id,
    toggle: (id: string) => setOpenId((current) => (current === id ? null : id)),
    rowRef: (id: string) => (node: HTMLElement | null) => {
      if (node === null) nodes.current.delete(id)
      else nodes.current.set(id, node)
    },
  }
}
