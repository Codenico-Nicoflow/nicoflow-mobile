import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ForgotPasswordFormData, forgotPasswordSchema } from '@nicoflow/shared/schemas';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthCard } from '@/components/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForgotPasswordMutation } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

export default function ForgotPassword() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data).unwrap();
      // Generic success message regardless of whether the account exists —
      // the backend never enumerates (SPEC §3). Only a genuine request
      // failure (network/5xx) reaches the catch below.
      setSubmitted(true);
    } catch (error) {
      setError('root', { message: resolveApiErrorMessage(error) });
    }
  };

  if (submitted) {
    return (
      <AuthCard title="Check your inbox" description="If an account exists for that email, we sent a reset link.">
        <Link href="/sign-in" className="text-sm text-center mt-3 font-medium text-primary dark:text-primary-dark">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" description="Enter your email and we'll send you a reset link.">
      <View className="gap-3">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        {errors.root && (
          <Text className="text-sm text-center text-destructive dark:text-destructive-dark">{errors.root.message}</Text>
        )}

        <Button label="Send reset link" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </View>

      <Link href="/sign-in" className="text-sm text-center mt-3 font-medium text-primary dark:text-primary-dark">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
