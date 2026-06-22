import * as React from 'react'

import { Label } from '~/components/ui/label'
import { Input, InputWrapper } from '~/components/ui/input'
import { cn } from '~/lib/utils'

interface FieldProps extends React.ComponentProps<typeof Input> {
  label: string
  error?: string
  hint?: string
  /** Icon rendered inside the input, before the text. */
  leftIcon?: React.ReactNode
  /** Action rendered on the right side of the label row (e.g. a "Forgot password?" link). */
  labelAction?: React.ReactNode
}

/**
 * A labelled Input wired for Inertia's `useForm` (error/hint are plain strings,
 * not react-hook-form state — so this works without the Metronic Form context).
 * Supports an optional leading icon and a label-row action for richer forms.
 */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, id, name, className, leftIcon, labelAction, ...props },
  ref
) {
  const fieldId = id ?? name
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  const input = (
    <Input
      id={fieldId}
      name={name}
      ref={ref}
      aria-invalid={!!error}
      aria-describedby={describedBy}
      className={cn(className)}
      {...props}
    />
  )

  return (
    <div className="space-y-2">
      {labelAction ? (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={fieldId}>{label}</Label>
          {labelAction}
        </div>
      ) : (
        <Label htmlFor={fieldId}>{label}</Label>
      )}

      {leftIcon ? (
        <InputWrapper aria-invalid={!!error}>
          {leftIcon}
          {input}
        </InputWrapper>
      ) : (
        input
      )}

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
