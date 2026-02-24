import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { UserRole, roleLabels, roleColors, roleIcons } from '../../src/types';

const roles: UserRole[] = ['founder', 'investor', 'mentor', 'service_provider', 'talent'];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegister = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(email, password, name, selectedRole);
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => step === 1 ? router.back() : setStep(1)}
            >
              <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
              <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
              <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            </View>
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the startup ecosystem</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                leftIcon="person-outline"
              />

              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <Button
                title="Continue"
                onPress={handleNext}
                size="large"
                style={styles.continueButton}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>What describes you best?</Text>
              <Text style={styles.subtitle}>This helps us personalize your experience</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.rolesContainer}>
                {roles.map((role) => {
                  const isSelected = selectedRole === role;
                  const color = roleColors[role];
                  const icon = roleIcons[role];
                  const label = roleLabels[role];

                  return (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleCard,
                        isSelected && { borderColor: color, backgroundColor: color + '15' }
                      ]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <View style={[styles.roleIcon, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon as any} size={28} color={color} />
                      </View>
                      <Text style={[styles.roleLabel, isSelected && { color }]}>{label}</Text>
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: color }]}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                disabled={!selectedRole}
                size="large"
                style={styles.registerButton}
              />
            </>
          )}

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#374151',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#6366F1',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 32,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  continueButton: {
    marginTop: 16,
  },
  rolesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginLeft: 16,
    flex: 1,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  loginText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  loginLink: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '600',
  },
});
