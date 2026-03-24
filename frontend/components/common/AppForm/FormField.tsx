'use client'

import { ControllerRenderProps, FieldValues, FieldPath } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { FieldConfig } from './types'
import { useCallback } from 'react'

interface FormFieldComponentProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  field: ControllerRenderProps<TFieldValues, TName>
  fieldConfig: FieldConfig
}

export function FormFieldComponent<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ field, fieldConfig }: FormFieldComponentProps<TFieldValues, TName>) {
  const { type, placeholder, options, disabled } = fieldConfig

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      field.onChange(file)
    },
    [field]
  )

  switch (type) {
    case 'email':
      return (
        <Input
          {...field}
          type="email"
          placeholder={placeholder}
          disabled={disabled}
        />
      )

    case 'password':
      return (
        <Input
          {...field}
          type="password"
          placeholder={placeholder}
          disabled={disabled}
        />
      )

    case 'number':
      return (
        <Input
          {...field}
          type="number"
          placeholder={placeholder}
          disabled={disabled}
        />
      )

    case 'textarea':
      return (
        <Textarea
          {...field}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
        />
      )

    case 'select':
      return (
        <Select value={field.value || ''} onValueChange={field.onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={field.value || false}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        </div>
      )

    case 'file':
      return (
        <Input
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
          accept="image/*"
        />
      )

    case 'date':
      return (
        <Input
          {...field}
          type="date"
          disabled={disabled}
        />
      )

    case 'text':
    default:
      return (
        <Input
          {...field}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
        />
      )
  }
}
