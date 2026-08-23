'use client'

import { useEffect } from 'react'

export default function ErrorRouteFlag() {
  useEffect(() => {
    document.body.dataset.errorRoute = '1'
    return () => {
      delete document.body.dataset.errorRoute
    }
  }, [])
  return null
}
