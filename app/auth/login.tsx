// app/auth/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MotionView } from '../../components/MotionView';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/dashboard/home'); // navigates to dashboard/home.tsx
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circle1} />

      <MotionView style={{ width: '100%' }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subHeader}>Sign in to continue your skincare journey.</Text>
      </MotionView>

      <MotionView delay={100} style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="hello@example.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={{ marginTop: SPACING.m }}>
          <PrimaryButton title="Login" onPress={handleLogin} loading={loading} />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/auth/register')}
          style={styles.footerLink}
        >
          <Text style={{ color: COLORS.textLight }}>
            Don't have an account?{' '}
            <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </MotionView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.l,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.secondary,
    opacity: 0.3,
  },
  backButton: { alignSelf: 'flex-start', marginBottom: SPACING.m },
  header: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, letterSpacing: -0.5 },
  subHeader: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: SPACING.s,
    marginBottom: SPACING.xl,
  },
  form: {
    backgroundColor: COLORS.card,
    padding: SPACING.l,
    borderRadius: RADIUS.l,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  inputContainer: { marginBottom: SPACING.m },
  label: { fontSize: 14, color: COLORS.text, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.s,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  footerLink: { alignSelf: 'center', marginTop: 20, padding: 10 },
});
