import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Avatar } from '../../src/components/Avatar';

const skillSuggestions = [
  'Product Management', 'Software Engineering', 'Marketing', 'Sales', 'Finance',
  'Design', 'Operations', 'Data Science', 'AI/ML', 'Blockchain',
  'Growth Hacking', 'Business Development', 'Legal', 'HR', 'Strategy'
];

const interestSuggestions = [
  'SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce',
  'AI/ML', 'Web3', 'CleanTech', 'FoodTech', 'PropTech',
  'Social Impact', 'Gaming', 'B2B', 'B2C', 'Marketplace'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic Info
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_image || null);
  
  // Step 2: Skills & Interests
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  
  // Step 3: Role-specific
  const [companyName, setCompanyName] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  const totalSteps = 3;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfileImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else if (skills.length < 10) {
      setSkills([...skills, skill]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 10) {
      setInterests([...interests, interest]);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfile({
        headline,
        bio,
        location,
        profile_image: profileImage || undefined,
        skills,
        interests,
        company_name: companyName || undefined,
        looking_for: lookingFor || undefined,
      });
      router.replace('/(tabs)/feed');
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/feed');
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>Help others get to know you better</Text>

      {/* Profile Image */}
      <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
        {profileImage ? (
          <Image 
            source={{ uri: profileImage }} 
            style={styles.profileImage} 
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={32} color="#6B7280" />
          </View>
        )}
        <View style={styles.editBadge}>
          <Ionicons name="pencil" size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <Input
        label="Headline"
        placeholder="e.g., Founder at TechStartup | Ex-Google"
        value={headline}
        onChangeText={setHeadline}
        maxLength={100}
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          placeholder="Tell us your story..."
          placeholderTextColor="#6B7280"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>
      </View>

      <Input
        label="Location"
        placeholder="e.g., San Francisco, CA"
        value={location}
        onChangeText={setLocation}
        leftIcon="location-outline"
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Your Skills & Interests</Text>
      <Text style={styles.stepSubtitle}>Select up to 10 of each</Text>

      <Text style={styles.sectionLabel}>Skills ({skills.length}/10)</Text>
      <View style={styles.tagsContainer}>
        {skillSuggestions.map((skill) => (
          <TouchableOpacity
            key={skill}
            style={[
              styles.tagChip,
              skills.includes(skill) && styles.tagChipSelected
            ]}
            onPress={() => toggleSkill(skill)}
          >
            <Text style={[
              styles.tagText,
              skills.includes(skill) && styles.tagTextSelected
            ]}>{skill}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Interests ({interests.length}/10)</Text>
      <View style={styles.tagsContainer}>
        {interestSuggestions.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.tagChip,
              interests.includes(interest) && styles.tagChipSelected
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text style={[
              styles.tagText,
              interests.includes(interest) && styles.tagTextSelected
            ]}>{interest}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Almost there!</Text>
      <Text style={styles.stepSubtitle}>A few more details to complete your profile</Text>

      {user?.role === 'founder' && (
        <Input
          label="Company/Startup Name"
          placeholder="Your company or project name"
          value={companyName}
          onChangeText={setCompanyName}
          leftIcon="business-outline"
        />
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>What are you looking for?</Text>
        <TextInput
          style={styles.bioInput}
          placeholder={
            user?.role === 'founder' 
              ? "e.g., Technical co-founder, seed funding, mentorship..." 
              : user?.role === 'investor'
              ? "e.g., Early-stage startups, SaaS, FinTech..."
              : "e.g., Advisory roles, startup opportunities..."
          }
          placeholderTextColor="#6B7280"
          value={lookingFor}
          onChangeText={setLookingFor}
          multiline
          numberOfLines={3}
          maxLength={300}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressBar,
                  index < step && styles.progressBarActive,
                  index === 0 && styles.progressBarFirst,
                  index === totalSteps - 1 && styles.progressBarLast,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 1 && (
            <Button
              title="Back"
              onPress={() => setStep(step - 1)}
              variant="outline"
              style={styles.backButton}
            />
          )}
          <Button
            title={step === totalSteps ? 'Complete' : 'Continue'}
            onPress={step === totalSteps ? handleComplete : () => setStep(step + 1)}
            loading={loading}
            style={styles.nextButton}
          />
        </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#374151',
  },
  progressBarActive: {
    backgroundColor: '#6366F1',
  },
  progressBarFirst: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  progressBarLast: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 32,
  },
  imagePickerContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  bioInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#F9FAFB',
    fontSize: 16,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  tagChipSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tagText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
