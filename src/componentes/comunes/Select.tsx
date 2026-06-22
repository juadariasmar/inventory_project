import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: { value: string | number; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, id, options = [], children, ...props }, ref) => {
    const selectId = id || React.useId()
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3 py-2 text-sm text-gray-900 bg-white border rounded-lg transition-premium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
          } ${className}`}
          {...props}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
