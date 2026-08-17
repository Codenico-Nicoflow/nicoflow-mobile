import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ForgotPasswordFormData, forgotPasswordSchema } from '@nicoflow/shared/schemas';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthCard } from '@/components/auth-card';
import { AuthTextField } from '@/components/auth-text-field';
import { Colors, Spacing } from '@/constants/theme';
import { useForgotPasswordMutation } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

export default function ForgotPassword() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

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
        <Link href="/sign-in" style={[styles.link, { color: colors.primary }]}>
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" description="Enter your email and we'll send you a reset link.">
      <View style={styles.fields}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthTextField
              placeholder="Email"
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

        {errors.root && <Text style={[styles.formError, { color: colors.destructive }]}>{errors.root.message}</Text>}

        <AuthButton label="Send reset link" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </View>

      <Link href="/sign-in" style={[styles.link, { color: colors.primary }]}>
        Back to sign in
      </Link>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.three },
  formError: { fontSize: 14, textAlign: 'center' },
  link: { fontSize: 14, textAlign: 'center', marginTop: Spacing.three, fontWeight: '500' },
});
