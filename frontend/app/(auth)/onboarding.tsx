import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

const skillSuggestions = [
  'Product Management', 'Software Engineering', 'UI/UX Design', 'Marketing', 'Sales',
  'Business Development', 'Finance', 'Data Science', 'Machine Learning', 'Growth Hacking',
  'Full Stack', 'Frontend', 'Backend', 'Mobile Development', 'DevOps', 'AI/ML'
];

const sectorSuggestions = [
  'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'E-commerce', 'AI/ML',
  'CleanTech', 'FoodTech', 'PropTech', 'InsurTech', 'AgriTech', 'Crypto/Web3'
];

const interestSuggestions = [
  'Startups', 'Investing', 'Networking', 'Mentoring', 'Co-founding',
  'Fundraising', 'Product Building', 'Scaling', 'Exit Strategy', 'Remote Work'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Profile data
  const [headline, setHeadline] = useState(user?.profile?.headline || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [location, setLocation] = useState(user?.profile?.location || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.profile?.linkedin_url || '');
  const [skills, setSkills] = useState<string[]>(user?.profile?.skills || []);
  const [sectors, setSectors] = useState<string[]>(user?.profile?.sectors || []);
  const [interests, setInterests] = useState<string[]>(user?.profile?.interests || []);
  const [lookingFor, setLookingFor] = useState(user?.profile?.looking_for || '');

  const totalSteps = 4;

  const toggleItem = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfile({
        headline,
        bio,
        location,
        linkedin_url: linkedinUrl,
        skills,
        sectors,
        interests,
        looking_for: lookingFor,
      });
      router.replace('/(tabs)/feed');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/feed');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>
            <Text style={styles.stepSubtitle}>Help others understand who you are</Text>
            
            <Input
              label="Professional Headline"
              placeholder="e.g., Serial Entrepreneur | Ex-Google | AI Enthusiast"
              value={headline}
              onChangeText={setHeadline}
              leftIcon="briefcase-outline"
            />
            
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Tell your story in a few sentences..."
                placeholderTextColor="#6B7280"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />
            </View>

            <Input
              label="Location"
              placeholder="e.g., San Francisco, CA"
              value={location}
              onChangeText={setLocation}
              leftIcon="location-outline"
            />

            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              leftIcon="logo-linkedin"
              autoCapitalize="none"
            />
          </>
        );
      
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Your Skills</Text>
            <Text style={styles.stepSubtitle}>Select skills that define your expertise</Text>
            
            <View style={styles.tagsContainer}>
              {skillSuggestions.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[styles.tag, skills.includes(skill) && styles.tagSelected]}
                  onPress={() => toggleItem(skill, skills, setSkills)}
                >
                  <Text style={[styles.tagText, skills.includes(skill) && styles.tagTextSelected]}>
                    {skill}
                  </Text>
                  {skills.includes(skill) && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.tagIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.selectedCount}>{skills.length} selected</Text>
          </>
        );
      
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Sectors & Interests</Text>
            <Text style={styles.stepSubtitle}>What industries excite you?</Text>
            
            <Text style={styles.sectionLabel}>Sectors</Text>
            <View style={styles.tagsContainer}>
              {sectorSuggestions.map((sector) => (
                <TouchableOpacity
                  key={sector}
                  style={[styles.tag, sectors.includes(sector) && styles.tagSelectedGreen]}
                  onPress={() => toggleItem(sector, sectors, setSectors)}
                >
                  <Text style={[styles.tagText, sectors.includes(sector) && styles.tagTextSelected]}>
                    {sector}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Interests</Text>
            <View style={styles.tagsContainer}>
              {interestSuggestions.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[styles.tag, interests.includes(interest) && styles.tagSelectedOrange]}
                  onPress={() => toggleItem(interest, interests, setInterests)}
                >
                  <Text style={[styles.tagText, interests.includes(interest) && styles.tagTextSelected]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      
      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>What are you looking for?</Text>
            <Text style={styles.stepSubtitle}>Help others know how to collaborate with you</Text>
            
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>Looking For</Text>
              <TextInput
                style={[styles.textArea, { minHeight: 120 }]}
                placeholder="e.g., Looking for a technical co-founder for my AI startup, or mentorship in fundraising..."
                placeholderTextColor="#6B7280"
                value={lookingFor}
                onChangeText={setLookingFor}
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={styles.summaryCard}>
              <Ionicons name="sparkles" size={24} color="#F59E0B" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Your Profile Summary</Text>
                <Text style={styles.summaryText}>
                  {skills.length} skills • {sectors.length} sectors • {interests.length} interests
                </Text>
              </View>
            </View>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={step === totalSteps ? 'Complete Setup' : 'Continue'}
            onPress={handleNext}
            loading={loading}
            size="large"
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginHorizontal: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 24,
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    color: '#F9FAFB',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  tagSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tagSelectedGreen: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tagSelectedOrange: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  tagText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  tagIcon: {
    marginLeft: 6,
  },
  selectedCount: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B15',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  summaryContent: {
    marginLeft: 12,
  },
  summaryTitle: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
});
