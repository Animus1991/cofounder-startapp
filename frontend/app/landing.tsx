import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../src/hooks/useResponsive';

const { width } = Dimensions.get('window');

// Feature data
const FEATURES = [
  {
    icon: 'people-outline',
    title: 'Smart Matching',
    description: 'AI-powered algorithm matches you with the perfect co-founders, investors, and mentors based on skills, interests, and goals.',
    color: '#6366F1',
  },
  {
    icon: 'rocket-outline',
    title: 'Startup Ecosystem',
    description: 'Connect with founders at every stage - from idea to Series C. Find your tribe and grow together.',
    color: '#10B981',
  },
  {
    icon: 'bulb-outline',
    title: 'Mentorship Network',
    description: 'Access experienced mentors who have been there, done that. Get guidance when you need it most.',
    color: '#F59E0B',
  },
  {
    icon: 'briefcase-outline',
    title: 'Talent Marketplace',
    description: 'Find top-tier talent ready to join early-stage startups. Equity-friendly and mission-driven.',
    color: '#8B5CF6',
  },
  {
    icon: 'analytics-outline',
    title: 'Investor Pipeline',
    description: 'Track your fundraising journey. Manage investor relationships and close rounds faster.',
    color: '#EC4899',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Private Communities',
    description: 'Join exclusive communities based on stage, sector, or role. Share insights and opportunities.',
    color: '#06B6D4',
  },
];

// How it works steps
const STEPS = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Tell us about yourself, your startup, and what you\'re looking for. Our AI learns your preferences.',
  },
  {
    number: '02',
    title: 'Get Matched',
    description: 'Receive personalized recommendations for co-founders, investors, mentors, or opportunities.',
  },
  {
    number: '03',
    title: 'Connect & Grow',
    description: 'Reach out, schedule meetings, and build meaningful relationships that accelerate your journey.',
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "Found my technical co-founder within 2 weeks. The AI matching is incredibly accurate.",
    name: "Sarah Chen",
    role: "CEO @ TechFlow",
    avatar: "SC",
    color: '#6366F1',
  },
  {
    quote: "As an investor, I discover quality deal flow that I wouldn't find elsewhere. Game changer.",
    name: "Michael Ross",
    role: "Partner @ Venture Capital",
    avatar: "MR",
    color: '#10B981',
  },
  {
    quote: "The mentorship connections helped me pivot my startup and raise our seed round.",
    name: "Emily Rodriguez",
    role: "Founder @ GreenTech",
    avatar: "ER",
    color: '#F59E0B',
  },
];

// Pricing plans
const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for exploring the ecosystem',
    features: [
      'Basic profile',
      '5 connections/month',
      'Community access',
      'Job board access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For serious founders and professionals',
    features: [
      'AI-powered matching',
      'Unlimited connections',
      'Priority support',
      'Analytics dashboard',
      'Investor pipeline',
      'Verified badge',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For accelerators and organizations',
    features: [
      'Everything in Pro',
      'Custom onboarding',
      'API access',
      'Dedicated success manager',
      'White-label options',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// Stats
const STATS = [
  { value: '10K+', label: 'Active Members' },
  { value: '2,500+', label: 'Connections Made' },
  { value: '$50M+', label: 'Funding Raised' },
  { value: '500+', label: 'Startups Launched' },
];

export default function LandingPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);

  const navigateToSignUp = () => {
    router.push('/(auth)/signup');
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  const isCompact = isMobile;
  const gridColumns = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navbar}>
        <View style={styles.navContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="rocket" size={28} color="#6366F1" />
            <Text style={styles.logoText}>CoFounderBay</Text>
          </View>
          
          {!isCompact && (
            <View style={styles.navLinks}>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Pricing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>About</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.navActions}>
            <TouchableOpacity style={styles.loginBtn} onPress={navigateToLogin}>
              <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signupBtn} onPress={navigateToSignUp}>
              <Text style={styles.signupBtnText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#111827', '#1E1B4B', '#111827']}
            style={styles.heroGradient}
          >
            <View style={[styles.heroContent, isCompact && styles.heroContentMobile]}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={14} color="#F59E0B" />
                <Text style={styles.heroBadgeText}>AI-Powered Startup Ecosystem</Text>
              </View>
              
              <Text style={[styles.heroTitle, isCompact && styles.heroTitleMobile]}>
                Find Your Perfect{'\n'}
                <Text style={styles.heroTitleHighlight}>Co-Founder</Text>
              </Text>
              
              <Text style={[styles.heroSubtitle, isCompact && styles.heroSubtitleMobile]}>
                Connect with founders, investors, mentors, and talent.{'\n'}
                Build meaningful relationships that accelerate your startup journey.
              </Text>
              
              <View style={[styles.heroCTAs, isCompact && styles.heroCTAsMobile]}>
                <TouchableOpacity style={styles.primaryCTA} onPress={navigateToSignUp}>
                  <Text style={styles.primaryCTAText}>Start Free Today</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryCTA}>
                  <Ionicons name="play-circle-outline" size={24} color="#D1D5DB" />
                  <Text style={styles.secondaryCTAText}>Watch Demo</Text>
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View style={[styles.statsRow, isCompact && styles.statsRowMobile]}>
                {STATS.map((stat, index) => (
                  <View key={index} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Hero Image/Illustration */}
            {!isCompact && (
              <View style={styles.heroImageContainer}>
                <Image
                  source={{ uri: 'https://images.pexels.com/photos/7414216/pexels-photo-7414216.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.heroImageOverlay} />
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Trusted By Section */}
        <View style={styles.trustedSection}>
          <Text style={styles.trustedTitle}>Trusted by founders from</Text>
          <View style={styles.trustedLogos}>
            {['Y Combinator', 'Techstars', '500 Global', 'Sequoia', 'a]6z'].map((logo, i) => (
              <View key={i} style={styles.trustedLogo}>
                <Text style={styles.trustedLogoText}>{logo}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>FEATURES</Text>
            <Text style={styles.sectionTitle}>Everything you need to{'\n'}build your startup network</Text>
            <Text style={styles.sectionSubtitle}>
              Powerful tools designed specifically for the startup ecosystem
            </Text>
          </View>
          
          <View style={[styles.featuresGrid, { flexDirection: isCompact ? 'column' : 'row', flexWrap: 'wrap' }]}>
            {FEATURES.map((feature, index) => (
              <View 
                key={index} 
                style={[
                  styles.featureCard,
                  { width: isCompact ? '100%' : isTablet ? '48%' : '31%' }
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                  <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.howItWorksGradient}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
              <Text style={styles.sectionTitle}>Get started in minutes</Text>
            </View>
            
            <View style={[styles.stepsContainer, isCompact && styles.stepsContainerMobile]}>
              {STEPS.map((step, index) => (
                <View key={index} style={[styles.stepCard, isCompact && styles.stepCardMobile]}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {index < STEPS.length - 1 && !isCompact && (
                    <View style={styles.stepConnector}>
                      <Ionicons name="arrow-forward" size={24} color="#374151" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TESTIMONIALS</Text>
            <Text style={styles.sectionTitle}>Loved by founders worldwide</Text>
          </View>
          
          <View style={[styles.testimonialsGrid, isCompact && styles.testimonialsGridMobile]}>
            {TESTIMONIALS.map((testimonial, index) => (
              <View key={index} style={[styles.testimonialCard, isCompact && styles.testimonialCardMobile]}>
                <Ionicons name="chatbubble-outline" size={24} color="#374151" style={styles.quoteIcon} />
                <Text style={styles.testimonialQuote}>"{testimonial.quote}"</Text>
                <View style={styles.testimonialAuthor}>
                  <View style={[styles.testimonialAvatar, { backgroundColor: testimonial.color }]}>
                    <Text style={styles.testimonialAvatarText}>{testimonial.avatar}</Text>
                  </View>
                  <View>
                    <Text style={styles.testimonialName}>{testimonial.name}</Text>
                    <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PRICING</Text>
            <Text style={styles.sectionTitle}>Simple, transparent pricing</Text>
            <Text style={styles.sectionSubtitle}>
              Start free. Upgrade when you're ready.
            </Text>
          </View>
          
          <View style={[styles.pricingGrid, isCompact && styles.pricingGridMobile]}>
            {PRICING.map((plan, index) => (
              <View 
                key={index} 
                style={[
                  styles.pricingCard,
                  plan.highlighted && styles.pricingCardHighlighted,
                  isCompact && styles.pricingCardMobile
                ]}
              >
                {plan.highlighted && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  {plan.period && <Text style={styles.planPeriod}>{plan.period}</Text>}
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>
                
                <View style={styles.planFeatures}>
                  {plan.features.map((feature, i) => (
                    <View key={i} style={styles.planFeatureRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={styles.planFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={[styles.planCTA, plan.highlighted && styles.planCTAHighlighted]}
                  onPress={navigateToSignUp}
                >
                  <Text style={[styles.planCTAText, plan.highlighted && styles.planCTATextHighlighted]}>
                    {plan.cta}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Final CTA Section */}
        <View style={styles.finalCTASection}>
          <LinearGradient
            colors={['#4F46E5', '#6366F1', '#818CF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.finalCTAGradient}
          >
            <Text style={[styles.finalCTATitle, isCompact && styles.finalCTATitleMobile]}>
              Ready to find your perfect match?
            </Text>
            <Text style={styles.finalCTASubtitle}>
              Join thousands of founders building the future together.
            </Text>
            <TouchableOpacity style={styles.finalCTAButton} onPress={navigateToSignUp}>
              <Text style={styles.finalCTAButtonText}>Get Started for Free</Text>
              <Ionicons name="arrow-forward" size={20} color="#6366F1" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerContent, isCompact && styles.footerContentMobile]}>
            <View style={styles.footerBrand}>
              <View style={styles.logoContainer}>
                <Ionicons name="rocket" size={24} color="#6366F1" />
                <Text style={styles.footerLogoText}>CoFounderBay</Text>
              </View>
              <Text style={styles.footerTagline}>
                The startup ecosystem platform for founders, investors, mentors, and talent.
              </Text>
            </View>
            
            {!isCompact && (
              <>
                <View style={styles.footerColumn}>
                  <Text style={styles.footerColumnTitle}>Product</Text>
                  <Text style={styles.footerLink}>Features</Text>
                  <Text style={styles.footerLink}>Pricing</Text>
                  <Text style={styles.footerLink}>Integrations</Text>
                  <Text style={styles.footerLink}>API</Text>
                </View>
                <View style={styles.footerColumn}>
                  <Text style={styles.footerColumnTitle}>Company</Text>
                  <Text style={styles.footerLink}>About</Text>
                  <Text style={styles.footerLink}>Blog</Text>
                  <Text style={styles.footerLink}>Careers</Text>
                  <Text style={styles.footerLink}>Press</Text>
                </View>
                <View style={styles.footerColumn}>
                  <Text style={styles.footerColumnTitle}>Legal</Text>
                  <Text style={styles.footerLink}>Privacy</Text>
                  <Text style={styles.footerLink}>Terms</Text>
                  <Text style={styles.footerLink}>Security</Text>
                </View>
              </>
            )}
          </View>
          
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>
              © 2025 CoFounderBay. All rights reserved.
            </Text>
            <View style={styles.footerSocial}>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-twitter" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-linkedin" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-github" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  // Navbar
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  navLinks: {
    flexDirection: 'row',
    gap: 32,
  },
  navLink: {
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loginBtnText: {
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  signupBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signupBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Hero
  heroSection: {
    minHeight: 700,
  },
  heroGradient: {
    flex: 1,
    paddingTop: 120,
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  heroContentMobile: {
    alignItems: 'center',
    textAlign: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 8,
  },
  heroBadgeText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 64,
    fontWeight: '800',
    color: '#F9FAFB',
    lineHeight: 72,
    marginBottom: 24,
  },
  heroTitleMobile: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'center',
  },
  heroTitleHighlight: {
    color: '#6366F1',
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#9CA3AF',
    lineHeight: 32,
    marginBottom: 40,
    maxWidth: 600,
  },
  heroSubtitleMobile: {
    fontSize: 17,
    textAlign: 'center',
  },
  heroCTAs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 60,
  },
  heroCTAsMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  primaryCTAText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  secondaryCTAText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 48,
  },
  statsRowMobile: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  heroImageContainer: {
    position: 'absolute',
    right: 0,
    top: 100,
    width: '45%',
    height: 500,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  // Trusted By
  trustedSection: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  trustedTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trustedLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 40,
  },
  trustedLogo: {
    opacity: 0.5,
  },
  trustedLogoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // Features
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 17,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 600,
  },
  featuresGrid: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    gap: 24,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 28,
    marginBottom: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  // How It Works
  howItWorksSection: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  howItWorksGradient: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 1000,
    marginHorizontal: 'auto',
    gap: 40,
  },
  stepsContainerMobile: {
    flexDirection: 'column',
    gap: 32,
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCardMobile: {
    width: '100%',
  },
  stepNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepConnector: {
    position: 'absolute',
    right: -32,
    top: 24,
  },
  // Testimonials
  testimonialsSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  testimonialsGrid: {
    flexDirection: 'row',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    gap: 24,
  },
  testimonialsGridMobile: {
    flexDirection: 'column',
  },
  testimonialCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 28,
  },
  testimonialCardMobile: {
    marginBottom: 16,
  },
  quoteIcon: {
    marginBottom: 16,
  },
  testimonialQuote: {
    fontSize: 17,
    color: '#D1D5DB',
    lineHeight: 28,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  testimonialRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Pricing
  pricingSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#0D1117',
  },
  pricingGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 1100,
    marginHorizontal: 'auto',
    gap: 24,
  },
  pricingGridMobile: {
    flexDirection: 'column',
  },
  pricingCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#374151',
  },
  pricingCardHighlighted: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
    transform: [{ scale: 1.02 }],
  },
  pricingCardMobile: {
    marginBottom: 16,
  },
  popularBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 42,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  planFeatures: {
    marginBottom: 24,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  planFeatureText: {
    fontSize: 15,
    color: '#D1D5DB',
  },
  planCTA: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  planCTAHighlighted: {
    backgroundColor: '#6366F1',
  },
  planCTAText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  planCTATextHighlighted: {
    color: '#FFFFFF',
  },
  // Final CTA
  finalCTASection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  finalCTAGradient: {
    borderRadius: 24,
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCTATitleMobile: {
    fontSize: 28,
  },
  finalCTASubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  finalCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  finalCTAButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6366F1',
  },
  // Footer
  footer: {
    backgroundColor: '#0D1117',
    paddingTop: 60,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  footerContent: {
    flexDirection: 'row',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    marginBottom: 40,
    gap: 60,
  },
  footerContentMobile: {
    flexDirection: 'column',
  },
  footerBrand: {
    flex: 2,
    marginRight: 40,
  },
  footerLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  footerTagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
    lineHeight: 22,
    maxWidth: 280,
  },
  footerColumn: {
    flex: 1,
  },
  footerColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  footerCopyright: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerSocial: {
    flexDirection: 'row',
    gap: 16,
  },
  socialIcon: {
    padding: 8,
  },
});
