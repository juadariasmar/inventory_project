'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@radix-ui/react-dropdown-menu'
import { EllipsisVertical } from 'lucide-react'
import { Children, cloneElement, isValidElement } from 'react'

interface Propiedades {
  children: React.ReactNode
}

export default function MenuDesplegableAcciones({ children }: Propiedades) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Opciones"
        >
          <EllipsisVertical className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="z-50 min-w-[160px] rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none py-1"
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child
          if (typeof child.type === 'symbol') return <DropdownMenuItem asChild>{child}</DropdownMenuItem>
          const childProps = child.props as Record<string, unknown>
          const className = typeof childProps.className === 'string' ? childProps.className : ''
          return (
            <DropdownMenuItem asChild>
              {cloneElement(child, { className: `${className} cursor-pointer` } as Record<string, unknown>)}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
