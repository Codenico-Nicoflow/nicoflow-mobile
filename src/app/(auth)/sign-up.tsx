import { useState } from 'react';
import { Text, View } from 'react-native';

import { Link, router } from 'expo-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterFormData, registerSchema } from '@nicoflow/shared/schemas';
import { Controller, useForm } from 'react-hook-form';

import { AuthCard } from '@/components/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegisterMutation } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

export default function SignUp() {
  const [register, { isLoading }] = useRegisterMutation();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register({ ...data, platform: 'mobile' }).unwrap();
      setRegisteredEmail(data.email);
    } catch (error) {
      setError('root', { message: resolveApiErrorMessage(error) });
    }
  };

  if (registeredEmail) {
    return (
      <AuthCard
        title="Check your email"
        description="We've sent a verification link to your inbox. Verify your email, then sign in."
      >
        <Button label="Go to sign in" onPress={() => router.replace('/sign-in')} />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" description="Join Nicoflow and get organized">
      <View className="gap-3">
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Username"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message}
            />
          )}
        />

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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              secureTextEntry
              autoComplete="new-password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        {errors.root && (
          <Text className="text-sm text-center text-destructive dark:text-destructive-dark">{errors.root.message}</Text>
        )}

        <Button label="Create account" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </View>

      <Link href="/sign-in" className="text-sm text-center mt-3 font-medium text-primary dark:text-primary-dark">
        Already have an account? Sign in
      </Link>
    </AuthCard>
  );
}
