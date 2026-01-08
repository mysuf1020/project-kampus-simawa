import {
  ControllerFieldState,
  ControllerProps,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormStateReturn,
} from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form'
import { Text } from './typography/text'

type FieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  label?: string
  description?: string
  descPosition?: 'top' | 'bottom'
  className?: string
  validMessage?: string
  invalidMessage?: string
  hideErrMessage?: boolean
  render: ({
    field,
    fieldState,
    formState,
  }: {
    field: ControllerRenderProps<TFieldValues, TName>
    fieldState: ControllerFieldState
    formState: UseFormStateReturn<TFieldValues>
  }) => React.ReactElement
}

const Field = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName> & FieldProps<TFieldValues, TName>) => {
  const {
    label,
    descPosition = 'top',
    description,
    className,
    render,
    validMessage,
    invalidMessage,
    hideErrMessage,
  } = props
  return (
    <div className={className}>
      <FormField
        {...props}
        render={(renderProps) => {
          return (
            <FormItem>
              {label && <FormLabel>{label}</FormLabel>}
              {description && descPosition === 'top' && (
                <FormDescription className="text-neutral-700">
                  {description}
                </FormDescription>
              )}
              <FormControl>{render(renderProps)}</FormControl>
              {description && descPosition === 'bottom' && (
                <FormDescription>{description}</FormDescription>
              )}
              {!hideErrMessage && <FormMessage />}
              {validMessage && <Text className="text-green-600">{validMessage}</Text>}
              {invalidMessage && <Text className="text-red-500">{invalidMessage}</Text>}
            </FormItem>
          )
        }}
      />
    </div>
  )
}
Field.displayName = 'Field'

export { Field }
