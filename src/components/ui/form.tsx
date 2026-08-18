import { createContext, useContext, useId } from 'react';
import { Text, View } from 'react-native';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

export const Form = FormProvider;

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

interface FormItemContextValue {
  id: string;
}

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

export function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

export function FormItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const id = useId();

  return <FormItemContext.Provider value={{ id }}><View className={cn('gap-2', className)}>{children}</View></FormItemContext.Provider>;
}

export function FormLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  const { error } = useFormField();

  return (
    <Label className={cn(error && 'text-destructive dark:text-destructive-dark', className)}>{children}</Label>
  );
}

export function FormControl({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function FormDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('text-sm text-muted-foreground dark:text-muted-foreground-dark', className)}>{children}</Text>;
}

export function FormMessage({ className }: { className?: string }) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? '') : undefined;

  if (!body) return null;

  return (
    <Text nativeID={formMessageId} className={cn('text-sm text-destructive dark:text-destructive-dark', className)}>
      {body}
    </Text>
  );
}
