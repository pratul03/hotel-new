'use client'

import { useForm, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { FormFieldComponent } from './FormField'
import { AppFormProps } from './types'

export function AppForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  columns = 1,
}: AppFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as T,
  })

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className={`grid gap-6 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {fields.map((fieldConfig) => (
            <div
              key={fieldConfig.name}
              className={columns === 2 && fieldConfig.span === 2 ? 'md:col-span-2' : ''}
            >
              <FormField
                control={form.control}
                name={fieldConfig.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fieldConfig.label}</FormLabel>
                    <FormControl>
                      <FormFieldComponent
                        field={field}
                        fieldConfig={fieldConfig}
                      />
                    </FormControl>
                    {fieldConfig.description && (
                      <FormDescription>{fieldConfig.description}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
