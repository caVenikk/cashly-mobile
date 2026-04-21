import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { signIn } from '@/src/lib/auth';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { tokens, dark } = useTokens();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Введите email и пароль');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const inputBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const placeholder = dark ? 'rgba(235,235,245,0.35)' : 'rgba(60,60,67,0.45)';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <View style={styles.brand}>
          <Text style={[styles.brandText, { color: tokens.text }]}>Cashly</Text>
          <Text style={[styles.brandSub, { color: tokens.textSecondary }]}>Вход в аккаунт</Text>
        </View>

        <View style={[styles.card, { backgroundColor: tokens.surfaceSolid, borderColor: tokens.hairline }]}>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: tokens.text }]}
            placeholder="email"
            placeholderTextColor={placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: tokens.text }]}
            placeholder="пароль"
            placeholderTextColor={placeholder}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={onSubmit}
          />

          {error ? <Text style={[styles.error, { color: CashlyTheme.accent.expense }]}>{error}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: CashlyTheme.accent.income, opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
            ]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Войти</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  brandText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 15,
    marginTop: 6,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
