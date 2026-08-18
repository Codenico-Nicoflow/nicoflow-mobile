import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginFormData, loginSchema } from '@nicoflow/shared/schemas';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthCard } from '@/components/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useLoginMutation, setToken, setUser, mobileTokenStorage } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

export default function SignIn() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember: true },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({ ...data, platform: 'mobile' }).unwrap();
      dispatch(setToken(result.token));
      dispatch(setUser(result.user));
      await mobileTokenStorage.setRefreshToken(result.refreshToken);
      router.replace('/');
    } catch (error) {
      setError('root', { message: resolveApiErrorMessage(error) });
    }
  };

  return (
    <AuthCard title="Sign in" description="Welcome back — enter your details to continue.">
      <View className="gap-3">
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email or username"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.identifier?.message}
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
              autoComplete="current-password"
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

        <Button label="Sign in" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </View>

      <Link href="/forgot-password" className="text-sm text-center mt-3 font-medium text-primary dark:text-primary-dark">
        Forgot password?
      </Link>
      <View className="flex-row justify-center mt-1">
        <Text className="text-muted-foreground dark:text-muted-foreground-dark">Don&apos;t have an account? </Text>
        <Link href="/sign-up" className="text-sm font-medium text-primary dark:text-primary-dark">
          Sign up
        </Link>
      </View>
    </AuthCard>
  );
}
