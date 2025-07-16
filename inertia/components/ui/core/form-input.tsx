import * as React from 'react'
import { Input, type InputProps as BaseInputProps } from './input'
import { Label } from './label'

export interface FormInputProps extends BaseInputProps {
  label?: string
  error?: string
  hint?: string
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <Input
          id={inputId}
          ref={ref}
          error={!!error}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export { FormInput }
