import * as React from 'react'

import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

interface FieldProps extends React.ComponentProps<typeof Input> {
  label: string
  error?: string
  hint?: string
}

/**
 * A labelled Input wired for Inertia's `useForm` (error/hint are plain strings,
 * not react-hook-form state — so this works without the Metronic Form context).
 */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, id, name, className, ...props },
  ref
) {
  const fieldId = id ?? name
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(className)}
        {...props}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
})
