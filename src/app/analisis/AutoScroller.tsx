'use client'
import { useEffect } from 'react'

export function AutoScroller() {
  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.slice(1)
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100) // Small delay to ensure render is complete
    }
  }, [])
  
  return null
}
