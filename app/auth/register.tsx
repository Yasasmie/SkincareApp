// app/auth/register.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MotionView } from '../../components/MotionView';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skinType, setSkinType] = useState('Normal');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName,
        email,
        skinType,
        createdAt: new Date().toISOString(),
        photoURL: null,
      });

      router.replace('/auth/login');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const SkinTypeOption = ({ type }: { type: string }) => (
    <TouchableOpacity
      onPress={() => setSkinType(type)}
      style={[styles.option, skinType === type && styles.optionSelected]}
    >
      <Text
        style={[
          styles.optionText,
          skinType === type && styles.optionTextSelected,
        ]}
      >
        {type}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.circle2} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <MotionView>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subHeader}>Start your journey to better skin.</Text>
      </MotionView>

      <MotionView delay={100} style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Jane Doe"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="jane@example.com"
            keyboardType="email-address"
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>What's your skin type?</Text>
          <View style={styles.optionsRow}>
            {['Oily', 'Dry', 'Normal', 'Combination'].map((type) => (
              <SkinTypeOption key={type} type={type} />
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
        <PrimaryButton title="Sign Up" onPress={handleSignUp} loading={loading} />

        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          style={styles.footerLink}
        >
          <Text style={{ color: COLORS.textLight }}>
            Already have an account?{' '}
            <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </MotionView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.l },
  circle2: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.accent,
    opacity: 0.1,
  },
  backButton: { marginTop: SPACING.xl, marginBottom: SPACING.m, alignSelf: 'flex-start' },
  header: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, letterSpacing: -0.5 },
  subHeader: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: SPACING.s,
    marginBottom: SPACING.xl,
  },
  form: { backgroundColor: COLORS.card, padding: SPACING.l, borderRadius: RADIUS.l, elevation: 4 },
  inputContainer: { marginBottom: SPACING.m },
  label: { fontSize: 14, color: COLORS.text, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.s,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    backgroundColor: 'transparent',
  },
  optionSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.textLight, fontSize: 14 },
  optionTextSelected: { color: '#FFF', fontWeight: 'bold' },
  footerLink: { alignSelf: 'center', marginTop: 20, padding: 10 },
});
