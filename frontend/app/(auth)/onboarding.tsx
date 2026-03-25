import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  KeyboardAvoidingView, 
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { UserRole, roleLabels, roleColors, roleIcons, StartupStage, stageLabels } from '../../src/types';

const { width } = Dimensions.get('window');

// Role-specific configurations
const ROLE_CONFIG: Record<string, {
  title: string;
  subtitle: string;
  steps: string[];
  skills: string[];
  interests: string[];
  specificQuestions: { key: string; label: string; placeholder: string; type: 'text' | 'textarea' | 'select' | 'multiselect' }[];
}> = {
  founder: {
    title: 'Welcome, Founder!',
    subtitle: "Let's set up your profile to find co-founders, mentors, and investors",
    steps: ['Basic Info', 'Your Startup', 'Skills & Needs', 'Goals'],
    skills: [
      'Product Management', 'Business Strategy', 'Fundraising', 'Sales', 'Marketing',
      'Growth Hacking', 'Team Building', 'Operations', 'Finance', 'Legal'
    ],
    interests: [
      'Finding Co-founder', 'Raising Funds', 'Mentorship', 'Networking',
      'Hiring Talent', 'Product Feedback', 'Scaling', 'Exit Strategy'
    ],
    specificQuestions: [
      { key: 'startup_name', label: 'Startup Name', placeholder: 'Your startup name', type: 'text' },
      { key: 'startup_stage', label: 'Current Stage', placeholder: 'Select stage', type: 'select' },
      { key: 'one_liner', label: 'One-Liner Pitch', placeholder: 'Describe your startup in one sentence', type: 'text' },
      { key: 'funding_status', label: 'Funding Status', placeholder: 'e.g., Bootstrapped, Raised $500K', type: 'text' },
    ]
  },
  investor: {
    title: 'Welcome, Investor!',
    subtitle: "Let's set up your profile to discover promising startups",
    steps: ['Basic Info', 'Investment Focus', 'Thesis', 'Preferences'],
    skills: [
      'Due Diligence', 'Portfolio Support', 'Board Advisory', 'Fundraising',
      'M&A', 'Financial Modeling', 'Market Analysis', 'Network Access'
    ],
    interests: [
      'Deal Flow', 'Co-investing', 'Mentoring Founders', 'Portfolio Events',
      'Industry Trends', 'Syndicate Deals', 'Angel Investing', 'Impact Investing'
    ],
    specificQuestions: [
      { key: 'investment_firm', label: 'Investment Firm/Fund', placeholder: 'Your firm name (or Independent)', type: 'text' },
      { key: 'check_size', label: 'Typical Check Size', placeholder: 'e.g., $50K - $250K', type: 'text' },
      { key: 'investment_thesis', label: 'Investment Thesis', placeholder: 'What do you look for in startups?', type: 'textarea' },
      { key: 'portfolio_count', label: 'Portfolio Companies', placeholder: 'Number of investments', type: 'text' },
    ]
  },
  mentor: {
    title: 'Welcome, Mentor!',
    subtitle: "Let's set up your profile to help founders succeed",
    steps: ['Basic Info', 'Expertise', 'Availability', 'Preferences'],
    skills: [
      'Product Strategy', 'Go-to-Market', 'Fundraising', 'Team Building',
      'Technical Architecture', 'Sales', 'Marketing', 'Operations', 'Legal', 'Finance'
    ],
    interests: [
      'Coaching Founders', 'Technical Guidance', 'Strategy Sessions', 'Networking Intros',
      'Board Advisory', 'Pro Bono Mentoring', 'Startup Communities', 'Speaking'
    ],
    specificQuestions: [
      { key: 'years_experience', label: 'Years of Experience', placeholder: 'Years in your field', type: 'text' },
      { key: 'past_roles', label: 'Notable Past Roles', placeholder: 'e.g., Ex-Google PM, Founded 2 startups', type: 'text' },
      { key: 'availability_hours', label: 'Hours per Month Available', placeholder: 'e.g., 4-8 hours', type: 'text' },
      { key: 'mentoring_style', label: 'Mentoring Style', placeholder: 'How do you like to mentor?', type: 'textarea' },
    ]
  },
  talent: {
    title: 'Welcome, Talent!',
    subtitle: "Let's set up your profile to find exciting startup opportunities",
    steps: ['Basic Info', 'Skills', 'Preferences', 'Goals'],
    skills: [
      'Full Stack Development', 'Frontend', 'Backend', 'Mobile Development', 'DevOps',
      'Data Science', 'Machine Learning', 'UI/UX Design', 'Product Management', 'Marketing'
    ],
    interests: [
      'Early Stage Startups', 'Remote Work', 'Equity Compensation', 'Co-founding',
      'Technical Leadership', 'Side Projects', 'Freelancing', 'Full-time Roles'
    ],
    specificQuestions: [
      { key: 'current_role', label: 'Current Role', placeholder: 'Your current job title', type: 'text' },
      { key: 'availability', label: 'Availability', placeholder: 'e.g., Full-time, Part-time, Weekends', type: 'text' },
      { key: 'compensation_pref', label: 'Compensation Preference', placeholder: 'e.g., Salary, Equity, or Mix', type: 'text' },
      { key: 'ideal_role', label: 'Ideal Next Role', placeholder: 'What are you looking for?', type: 'textarea' },
    ]
  },
};

// Default config for other roles
const DEFAULT_CONFIG = {
  title: 'Welcome!',
  subtitle: "Let's set up your profile",
  steps: ['Basic Info', 'Skills', 'Interests', 'Goals'],
  skills: [
    'Product Management', 'Software Engineering', 'UI/UX Design', 'Marketing', 'Sales',
    'Business Development', 'Finance', 'Data Science', 'Machine Learning', 'Growth Hacking'
  ],
  interests: [
    'Startups', 'Investing', 'Networking', 'Mentoring', 'Co-founding',
    'Fundraising', 'Product Building', 'Scaling', 'Remote Work', 'Communities'
  ],
  specificQuestions: []
};

const SECTORS = [
  'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'E-commerce', 'AI/ML',
  'CleanTech', 'FoodTech', 'PropTech', 'InsurTech', 'AgriTech', 'Crypto/Web3',
  'B2B', 'B2C', 'Marketplace', 'Developer Tools', 'Enterprise', 'Consumer'
];

const STAGES: StartupStage[] = ['idea', 'mvp', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  
  // Determine user's primary role
  const primaryRole = user?.roles?.[0] || 'founder';
  const config = ROLE_CONFIG[primaryRole] || DEFAULT_CONFIG;
  const totalSteps = config.steps.length;
  
  // Profile data
  const [formData, setFormData] = useState({
    headline: user?.profile?.headline || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    linkedinUrl: user?.profile?.linkedin_url || '',
    skills: user?.profile?.skills || [],
    sectors: user?.profile?.sectors || [],
    interests: user?.profile?.interests || [],
    stagePreferences: user?.profile?.stage_preferences || [],
    lookingFor: user?.profile?.looking_for || '',
    remoteOk: user?.profile?.remote_ok ?? true,
    availabilityHours: user?.profile?.availability_hours || 0,
    // Role-specific fields
    startup_name: '',
    startup_stage: 'mvp' as StartupStage,
    one_liner: '',
    funding_status: '',
    investment_firm: '',
    check_size: '',
    investment_thesis: '',
    portfolio_count: '',
    years_experience: '',
    past_roles: '',
    mentoring_style: '',
    current_role: '',
    availability: '',
    compensation_pref: '',
    ideal_role: '',
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Animate step transitions
    Animated.timing(animatedValue, {
      toValue: step,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when field is updated
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const toggleArrayItem = (key: string, item: string) => {
    const current = formData[key as keyof typeof formData] as string[];
    if (current.includes(item)) {
      updateFormData(key, current.filter(i => i !== item));
    } else {
      updateFormData(key, [...current, item]);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Basic Info
        if (!formData.headline.trim()) {
          newErrors.headline = 'Please add a professional headline';
        }
        break;
      case 1: // Role-specific / Skills
        if (formData.skills.length < 2) {
          newErrors.skills = 'Please select at least 2 skills';
        }
        break;
      case 2: // Interests / Sectors
        if (formData.sectors.length < 1) {
          newErrors.sectors = 'Please select at least 1 sector';
        }
        break;
      case 3: // Goals
        // Optional step
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfile({
        headline: formData.headline,
        bio: formData.bio,
        location: formData.location,
        linkedin_url: formData.linkedinUrl,
        skills: formData.skills,
        sectors: formData.sectors,
        interests: formData.interests,
        stage_preferences: formData.stagePreferences,
        looking_for: formData.lookingFor,
        remote_ok: formData.remoteOk,
        availability_hours: formData.availabilityHours,
      });
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/dashboard');
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {config.steps.map((stepName, index) => (
        <View key={index} style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            index < step && styles.progressDotCompleted,
            index === step && styles.progressDotActive,
          ]}>
            {index < step ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.progressDotText,
                index === step && styles.progressDotTextActive
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={[
            styles.progressLabel,
            index === step && styles.progressLabelActive
          ]}>
            {stepName}
          </Text>
          {index < config.steps.length - 1 && (
            <View style={[
              styles.progressLine,
              index < step && styles.progressLineCompleted
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep0 = () => (
    <>
      <View style={styles.roleHeader}>
        <View style={[styles.roleIcon, { backgroundColor: roleColors[primaryRole as UserRole] + '20' }]}>
          <Ionicons 
            name={roleIcons[primaryRole as UserRole] as any || 'person'} 
            size={32} 
            color={roleColors[primaryRole as UserRole] || '#6366F1'} 
          />
        </View>
        <Text style={styles.stepTitle}>{config.title}</Text>
        <Text style={styles.stepSubtitle}>{config.subtitle}</Text>
      </View>
      
      <Input
        label="Professional Headline *"
        placeholder="e.g., Serial Entrepreneur | Ex-Google | AI Enthusiast"
        value={formData.headline}
        onChangeText={(v) => updateFormData('headline', v)}
        leftIcon="briefcase-outline"
        error={errors.headline}
      />
      
      <View style={styles.textAreaContainer}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Tell your story in a few sentences..."
          placeholderTextColor="#6B7280"
          value={formData.bio}
          onChangeText={(v) => updateFormData('bio', v)}
          multiline
          numberOfLines={4}
        />
      </View>

      <Input
        label="Location"
        placeholder="e.g., San Francisco, CA"
        value={formData.location}
        onChangeText={(v) => updateFormData('location', v)}
        leftIcon="location-outline"
      />

      <Input
        label="LinkedIn URL"
        placeholder="https://linkedin.com/in/yourprofile"
        value={formData.linkedinUrl}
        onChangeText={(v) => updateFormData('linkedinUrl', v)}
        leftIcon="logo-linkedin"
        autoCapitalize="none"
      />

      {/* Remote preference */}
      <TouchableOpacity 
        style={styles.checkboxRow}
        onPress={() => updateFormData('remoteOk', !formData.remoteOk)}
      >
        <View style={[styles.checkbox, formData.remoteOk && styles.checkboxChecked]}>
          {formData.remoteOk && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={styles.checkboxLabel}>Open to remote collaboration</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Your Skills & Expertise</Text>
      <Text style={styles.stepSubtitle}>Select skills that define what you bring to the table</Text>
      
      {errors.skills && <Text style={styles.errorText}>{errors.skills}</Text>}
      
      <View style={styles.tagsContainer}>
        {config.skills.map((skill) => (
          <TouchableOpacity
            key={skill}
            style={[styles.tag, formData.skills.includes(skill) && styles.tagSelected]}
            onPress={() => toggleArrayItem('skills', skill)}
          >
            <Text style={[styles.tagText, formData.skills.includes(skill) && styles.tagTextSelected]}>
              {skill}
            </Text>
            {formData.skills.includes(skill) && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.tagIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.selectedCount}>
        {formData.skills.length} selected {formData.skills.length < 2 && '(min 2)'}
      </Text>

      {/* Role-specific questions for founders/investors */}
      {(primaryRole === 'founder' || primaryRole === 'investor') && (
        <View style={styles.roleSpecificSection}>
          <Text style={styles.sectionLabel}>
            {primaryRole === 'founder' ? 'About Your Startup' : 'Investment Focus'}
          </Text>
          {config.specificQuestions.slice(0, 2).map((q) => (
            <View key={q.key} style={styles.formGroup}>
              <Text style={styles.label}>{q.label}</Text>
              {q.type === 'select' && q.key === 'startup_stage' ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageSelector}>
                  {STAGES.map((stage) => (
                    <TouchableOpacity
                      key={stage}
                      style={[
                        styles.stageChip,
                        formData.startup_stage === stage && styles.stageChipSelected
                      ]}
                      onPress={() => updateFormData('startup_stage', stage)}
                    >
                      <Text style={[
                        styles.stageChipText,
                        formData.startup_stage === stage && styles.stageChipTextSelected
                      ]}>
                        {stageLabels[stage]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={[styles.input, q.type === 'textarea' && styles.textArea]}
                  placeholder={q.placeholder}
                  placeholderTextColor="#6B7280"
                  value={formData[q.key as keyof typeof formData] as string}
                  onChangeText={(v) => updateFormData(q.key, v)}
                  multiline={q.type === 'textarea'}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Sectors & Interests</Text>
      <Text style={styles.stepSubtitle}>What industries and topics excite you?</Text>
      
      <Text style={styles.sectionLabel}>Sectors *</Text>
      {errors.sectors && <Text style={styles.errorText}>{errors.sectors}</Text>}
      <View style={styles.tagsContainer}>
        {SECTORS.map((sector) => (
          <TouchableOpacity
            key={sector}
            style={[styles.tag, formData.sectors.includes(sector) && styles.tagSelectedGreen]}
            onPress={() => toggleArrayItem('sectors', sector)}
          >
            <Text style={[styles.tagText, formData.sectors.includes(sector) && styles.tagTextSelected]}>
              {sector}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Interests</Text>
      <View style={styles.tagsContainer}>
        {config.interests.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[styles.tag, formData.interests.includes(interest) && styles.tagSelectedOrange]}
            onPress={() => toggleArrayItem('interests', interest)}
          >
            <Text style={[styles.tagText, formData.interests.includes(interest) && styles.tagTextSelected]}>
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stage preferences for investors/mentors */}
      {(primaryRole === 'investor' || primaryRole === 'mentor') && (
        <View style={styles.roleSpecificSection}>
          <Text style={styles.sectionLabel}>Preferred Startup Stages</Text>
          <View style={styles.tagsContainer}>
            {STAGES.map((stage) => (
              <TouchableOpacity
                key={stage}
                style={[
                  styles.tag,
                  formData.stagePreferences.includes(stage) && styles.tagSelectedPurple
                ]}
                onPress={() => toggleArrayItem('stagePreferences', stage)}
              >
                <Text style={[
                  styles.tagText,
                  formData.stagePreferences.includes(stage) && styles.tagTextSelected
                ]}>
                  {stageLabels[stage]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>What are you looking for?</Text>
      <Text style={styles.stepSubtitle}>Help others understand how they can work with you</Text>
      
      <View style={styles.textAreaContainer}>
        <Text style={styles.label}>Looking For</Text>
        <TextInput
          style={[styles.textArea, { minHeight: 120 }]}
          placeholder={
            primaryRole === 'founder' 
              ? "e.g., Looking for a technical co-founder with ML expertise, or seeking seed funding of $500K..."
              : primaryRole === 'investor'
              ? "e.g., Looking for early-stage SaaS startups with strong founding teams..."
              : "e.g., Looking to mentor early-stage founders in product and go-to-market..."
          }
          placeholderTextColor="#6B7280"
          value={formData.lookingFor}
          onChangeText={(v) => updateFormData('lookingFor', v)}
          multiline
          numberOfLines={5}
        />
      </View>

      {/* Profile Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="sparkles" size={24} color="#F59E0B" />
          <Text style={styles.summaryTitle}>Your Profile Summary</Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{formData.skills.length}</Text>
            <Text style={styles.summaryStatLabel}>Skills</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{formData.sectors.length}</Text>
            <Text style={styles.summaryStatLabel}>Sectors</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{formData.interests.length}</Text>
            <Text style={styles.summaryStatLabel}>Interests</Text>
          </View>
        </View>

        {formData.headline && (
          <View style={styles.summaryPreview}>
            <Text style={styles.summaryPreviewLabel}>Headline</Text>
            <Text style={styles.summaryPreviewText}>{formData.headline}</Text>
          </View>
        )}

        <View style={styles.aiMatchBanner}>
          <Ionicons name="flash" size={18} color="#6366F1" />
          <Text style={styles.aiMatchText}>
            Our AI will use this info to find your best matches!
          </Text>
        </View>
      </View>
    </>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep0();
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#F9FAFB" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step Indicators */}
        {renderProgressIndicator()}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Button
                title={step === totalSteps - 1 ? 'Complete Setup' : 'Continue'}
                onPress={handleNext}
                loading={loading}
                size="large"
              />
            </View>
          </View>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
  },
  progressDotText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  progressDotTextActive: {
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#F9FAFB',
    fontWeight: '500',
  },
  progressLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: '#374151',
    zIndex: -1,
  },
  progressLineCompleted: {
    backgroundColor: '#10B981',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  roleHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  roleIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
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
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    color: '#F9FAFB',
    fontSize: 16,
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
  tagSelectedPurple: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
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
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 8,
  },
  roleSpecificSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  formGroup: {
    marginBottom: 16,
  },
  stageSelector: {
    marginBottom: 8,
  },
  stageChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  stageChipSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  stageChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  stageChipTextSelected: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkboxLabel: {
    color: '#D1D5DB',
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  summaryStatLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  summaryPreview: {
    marginBottom: 16,
  },
  summaryPreviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryPreviewText: {
    fontSize: 15,
    color: '#D1D5DB',
  },
  aiMatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F115',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  aiMatchText: {
    flex: 1,
    fontSize: 13,
    color: '#6366F1',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  backBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
  },
});
