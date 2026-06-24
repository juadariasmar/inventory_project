import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, type = 'text', ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full px-3 py-2 text-sm text-gray-900 bg-white border rounded-lg transition-premium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
