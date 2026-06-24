'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Tema = 'light' | 'dark'

interface ContextoTema {
  tema: Tema
  toggleTema: () => void
}

const Contexto = createContext<ContextoTema>({ tema: 'light', toggleTema: () => {} })

const STORAGE_KEY = 'inventory-theme'

function obtenerTemaInicial(): Tema {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignorar */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function aplicarTemaAlDOM(tema: Tema) {
  const raiz = document.documentElement
  if (tema === 'dark') {
    raiz.classList.add('dark')
  } else {
    raiz.classList.remove('dark')
  }
}

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>('light')
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    const inicial = obtenerTemaInicial()
    setTema(inicial)
    aplicarTemaAlDOM(inicial)
    setMontado(true)
  }, [])

  const toggleTema = useCallback(() => {
    setTema((prev) => {
      const siguiente: Tema = prev === 'light' ? 'dark' : 'light'
      aplicarTemaAlDOM(siguiente)
      try { localStorage.setItem(STORAGE_KEY, siguiente) } catch { /* ignorar */ }
      return siguiente
    })
  }, [])

  if (!montado) {
    return <>{children}</>
  }

  return (
    <Contexto.Provider value={{ tema, toggleTema }}>
      {children}
    </Contexto.Provider>
  )
}

export function usarTema() {
  return useContext(Contexto)
}
