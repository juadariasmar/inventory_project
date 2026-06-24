import React from 'react'
import { AlertCircle } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options?: { value: string | number; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, hint, id, options = [], children, required, ...props }, ref) => {
    const generatedId = React.useId()
    const selectId = id || generatedId
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`
    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-required={required || undefined}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={`w-full px-3 py-2 text-sm text-gray-900 bg-white border rounded-lg transition-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m2%204%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9 ${
              error
                ? 'border-error focus-visible:border-error focus-visible:ring-error/20'
                : 'border-gray-300'
            } ${className}`}
            {...props}
          >
            {children || options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && (
            <div className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
              <AlertCircle className="h-4 w-4 text-error" aria-hidden="true" />
            </div>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">{hint}</p>
        )}
        {error && (
          <p id={errorId} role="alert" className="flex items-start gap-1 text-xs text-error font-medium">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
