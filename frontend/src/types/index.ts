// User types
export type UserRole = 'founder' | 'investor' | 'mentor' | 'service_provider' | 'talent';

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  interests: string[];
  linkedin_url?: string;
  website?: string;
  profile_image?: string;
  cover_image?: string;
  company_name?: string;
  company_stage?: string;
  investment_range?: string;
  expertise_areas: string[];
  services_offered: string[];
  looking_for?: string;
  connection_count: number;
  post_count: number;
  is_verified: boolean;
  needs_onboarding?: boolean;
  created_at: string;
}

// Post types
export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  content: string;
  created_at: string;
}

export interface Post {
  post_id: string;
  user_id: string;
  user_name: string;
  user_headline?: string;
  user_image?: string;
  user_role: string;
  content: string;
  image?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  comments: Comment[];
}

// Connection types
export interface Connection {
  connection_id: string;
  user_id: string;
  target_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  other_user?: User;
  is_sender?: boolean;
}

// Message types
export interface Message {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  last_message: string;
  unread_count: number;
  last_message_at: string;
}

// AI Recommendation
export interface AIRecommendation {
  user_id: string;
  user_name: string;
  user_image?: string;
  user_role: string;
  headline?: string;
  match_score: number;
  match_reason: string;
}

// Auth types
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  needs_onboarding?: boolean;
}

// Role display helpers
export const roleLabels: Record<UserRole, string> = {
  founder: 'Founder',
  investor: 'Investor',
  mentor: 'Mentor',
  service_provider: 'Service Provider',
  talent: 'Talent',
};

export const roleColors: Record<UserRole, string> = {
  founder: '#6366F1',
  investor: '#10B981',
  mentor: '#F59E0B',
  service_provider: '#EC4899',
  talent: '#8B5CF6',
};

export const roleIcons: Record<UserRole, string> = {
  founder: 'rocket',
  investor: 'cash-outline',
  mentor: 'school-outline',
  service_provider: 'briefcase-outline',
  talent: 'person-outline',
};
