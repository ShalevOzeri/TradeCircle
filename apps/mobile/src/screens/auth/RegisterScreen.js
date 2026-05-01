import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { register } from '@tradecircle/api-client';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    setErr('');
    setLoading(true);
    try {
      const res = await register(form);
      await loginUser(res.token, res.user);
    } catch (e) {
      setErr(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        {err ? <Text style={styles.error}>{err}</Text> : null}

        {[
          { key: 'fullName', label: 'Full Name' },
          { key: 'username', label: 'Username', auto: 'none' },
          { key: 'email', label: 'Email', keyType: 'email-address' },
          { key: 'password', label: 'Password', secure: true },
        ].map(({ key, label, auto, keyType, secure }) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={label}
            autoCapitalize={auto || 'words'}
            keyboardType={keyType || 'default'}
            secureTextEntry={!!secure}
            value={form[key]}
            onChangeText={set(key)}
          />
        ))}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '700', color: '#1e3a5f', textAlign: 'center', marginBottom: 24 },
  error: { color: '#dc2626', marginBottom: 12, textAlign: 'center' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 12,
  },
  btn: {
    backgroundColor: '#2563eb', borderRadius: 10, padding: 15,
    alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', color: '#2563eb', fontSize: 14 },
});
