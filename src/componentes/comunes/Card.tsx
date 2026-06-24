import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  asRegion?: boolean
  labelledBy?: string
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', glass = false, asRegion, labelledBy, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={asRegion ? 'region' : undefined}
        aria-labelledby={labelledBy}
        className={`${
          glass ? 'glass' : 'bg-white'
        } p-6 rounded-xl shadow-sm border border-gray-200 transition-premium hover:shadow-md ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
