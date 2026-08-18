import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginFormData, loginSchema } from '@nicoflow/shared/schemas';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import { AuthCard } from '@/components/auth-card';
import { AuthTextField } from '@/components/auth-text-field';
import { Colors, Spacing } from '@/constants/theme';
import { useAppDispatch, useLoginMutation, setToken, setUser, mobileTokenStorage } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

export default function SignIn() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

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
      <View style={styles.fields}>
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthTextField
              placeholder="Email or username"
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
            <AuthTextField
              placeholder="Password"
              secureTextEntry
              autoComplete="current-password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        {errors.root && <Text style={[styles.formError, { color: colors.destructive }]}>{errors.root.message}</Text>}

        <AuthButton label="Sign in" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </View>

      <Link href="/forgot-password" style={[styles.link, { color: colors.primary }]}>
        Forgot password?
      </Link>
      <Text style={styles.bottomRow}>
        <Text style={{ color: colors.textSecondary }}>Don&apos;t have an account? </Text>
        <Link href="/sign-up" style={{ color: colors.primary, fontWeight: '500' }}>
          Sign up
        </Link>
      </Text>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.three },
  formError: { fontSize: 14, textAlign: 'center' },
  link: { fontSize: 14, textAlign: 'center', marginTop: Spacing.three, fontWeight: '500' },
  bottomRow: { fontSize: 14, textAlign: 'center', marginTop: Spacing.one },
});
