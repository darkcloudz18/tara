'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<T[]>
  pageSize?: number
  threshold?: number
  enabled?: boolean
}

interface UseInfiniteScrollResult<T> {
  items: T[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => void
  refresh: () => void
}

export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
  threshold = 200,
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const loadData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!enabled) return

      try {
        if (isRefresh) {
          setLoading(true)
          setError(null)
        } else {
          setLoadingMore(true)
        }

        const newItems = await fetchFn(pageNum, pageSize)

        if (isRefresh) {
          setItems(newItems)
        } else {
          setItems((prev) => [...prev, ...newItems])
        }

        setHasMore(newItems.length === pageSize)
        setPage(pageNum)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [fetchFn, pageSize, enabled]
  )

  // Initial load
  useEffect(() => {
    loadData(0, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!enabled || loading || loadingMore || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadData(page + 1)
        }
      },
      { rootMargin: `${threshold}px` }
    )

    const sentinel = document.getElementById('infinite-scroll-sentinel')
    if (sentinel) {
      observerRef.current.observe(sentinel)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [enabled, loading, loadingMore, hasMore, page, threshold, loadData])

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadData(page + 1)
    }
  }, [loadingMore, hasMore, page, loadData])

  const refresh = useCallback(() => {
    setPage(0)
    setHasMore(true)
    loadData(0, true)
  }, [loadData])

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  }
}
