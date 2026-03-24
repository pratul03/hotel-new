import { ZodSchema } from 'zod'
import { FieldValues } from 'react-hook-form'
import { LucideIcon } from 'lucide-react'

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea'
  | 'select' 
  | 'date' 
  | 'daterange' 
  | 'checkbox' 
  | 'file' 
  | 'rating'

export interface SelectOption {
  label: string
  value: string
}

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  options?: SelectOption[]
  disabled?: boolean
  description?: string
  required?: boolean
  span?: 1 | 2
}

export interface AppFormProps<T extends FieldValues> {
  schema: ZodSchema
  defaultValues: Partial<T>
  fields: FieldConfig[]
  onSubmit: (data: T) => Promise<void> | void
  isLoading?: boolean
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  columns?: 1 | 2
}
