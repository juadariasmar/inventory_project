import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${
          glass ? 'glass' : 'bg-white'
        } p-6 rounded-xl shadow-premium border border-border transition-premium hover:shadow-md ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
