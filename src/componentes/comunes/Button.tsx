import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  isLoading?: boolean
  loadingText?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', isLoading, loadingText = 'Cargando...', children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4 py-2.5 text-sm select-none active:scale-[0.98]'

    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm active:shadow-xs',
      secondary: 'bg-surface text-foreground border border-border hover:bg-surface-alt hover:border-border-strong shadow-sm',
      danger: 'bg-error text-error-foreground hover:bg-error-hover shadow-sm active:shadow-xs',
      success: 'bg-success text-success-foreground hover:bg-success-hover shadow-sm active:shadow-xs',
      ghost: 'text-foreground hover:bg-muted active:bg-muted',
    }

    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        aria-disabled={isDisabled || undefined}
        className={`${baseStyles} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" aria-hidden="true" />
            <span>{loadingText}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
