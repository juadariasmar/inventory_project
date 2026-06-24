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
          glass ? 'glass dark:glass-dark' : 'bg-surface border border-border'
        } p-6 rounded-xl shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
