// User types
export type UserRole = 'founder' | 'investor' | 'mentor' | 'service_provider' | 'talent' | 'startup_team' | 'ecosystem_org';
export type OrgType = 'startup' | 'investor_org' | 'accelerator' | 'university' | 'ngo' | 'government';
export type StartupStage = 'idea' | 'mvp' | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'ipo';
export type OpportunityType = 'cofounder' | 'full_time' | 'part_time' | 'freelance' | 'internship' | 'advisor';
export type CompensationType = 'salary' | 'equity' | 'mixed' | 'unpaid';
export type IntentType = 'looking_for' | 'offering';
export type PipelineStage = 'new' | 'contacted' | 'meeting' | 'due_diligence' | 'term_sheet' | 'pass' | 'invested';

// Profile
export interface PersonProfile {
  headline?: string;
  bio?: string;
  location?: string;
  remote_ok: boolean;
  availability_hours?: number;
  linkedin_url?: string;
  website?: string;
  twitter_url?: string;
  github_url?: string;
  profile_image?: string;
  cover_image?: string;
  skills: string[];
  skill_levels: Record<string, number>;
  interests: string[];
  sectors: string[];
  stage_preferences: StartupStage[];
  compensation_preferences: CompensationType[];
  looking_for?: string;
  verification_status: string;
}

// Intent Card
export interface IntentCard {
  intent_id: string;
  type: IntentType;
  title: string;
  description: string;
  stage?: StartupStage;
  commitment?: string;
  compensation_pref?: CompensationType;
  skills_needed: string[];
  is_active: boolean;
  created_at?: string;
}

// User
export interface User {
  user_id: string;
  email: string;
  name: string;
  roles: UserRole[];
  profile: PersonProfile;
  intent_cards: IntentCard[];
  connection_count: number;
  post_count: number;
  trust_score: number;
  needs_onboarding?: boolean;
  created_at: string;
}

// Organization
export interface Organization {
  org_id: string;
  type: OrgType;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  location?: string;
  created_by: string;
  members: OrgMember[];
  startup_profile?: StartupProfile;
  investor_profile?: InvestorProfile;
  is_verified: boolean;
  created_at: string;
}

export interface OrgMember {
  user_id: string;
  role: string;
  joined_at: string;
}

export interface StartupProfile {
  stage: StartupStage;
  sector: string;
  sub_sectors: string[];
  founded_date?: string;
  team_size?: number;
  traction_metrics: Record<string, any>;
  pitch_deck_url?: string;
  funding_raised?: number;
  funding_seeking?: number;
  one_liner?: string;
}

export interface InvestorProfile {
  thesis?: string;
  ticket_min?: number;
  ticket_max?: number;
  stages: StartupStage[];
  sectors: string[];
  portfolio_count: number;
  check_size_avg?: number;
}

// Opportunity
export interface Opportunity {
  opportunity_id: string;
  creator_id: string;
  org_id?: string;
  type: OpportunityType;
  title: string;
  description: string;
  requirements: string[];
  skills_required: string[];
  location?: string;
  remote_ok: boolean;
  compensation_type: CompensationType;
  compensation_details?: string;
  equity_range?: string;
  commitment?: string;
  deadline?: string;
  status: string;
  applications_count: number;
  created_at: string;
  creator?: Partial<User>;
  organization?: Partial<Organization>;
}

export interface Application {
  application_id: string;
  opportunity_id: string;
  applicant_id: string;
  message: string;
  resume_url?: string;
  portfolio_url?: string;
  status: string;
  created_at: string;
  applicant?: User;
}

// Collaboration
export interface CollaborationProposal {
  proposal_id: string;
  from_user_id: string;
  to_user_id?: string;
  to_org_id?: string;
  title: string;
  scope: string;
  role: string;
  timeframe?: string;
  compensation_type: CompensationType;
  compensation_details?: string;
  milestones: string[];
  status: string;
  workspace_id?: string;
  created_at: string;
  from_user?: Partial<User>;
  to_user?: Partial<User>;
}

export interface Workspace {
  workspace_id: string;
  proposal_id: string;
  participants: string[];
  title: string;
  tasks: WorkspaceTask[];
  documents: string[];
  created_at: string;
}

export interface WorkspaceTask {
  task_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
  status: string;
  created_by: string;
  created_at: string;
}

// Mentoring
export interface MentorProfile {
  user_id: string;
  expertise: string[];
  bio?: string;
  hourly_rate?: number;
  is_free: boolean;
  availability: Record<string, string[]>;
  session_duration: number;
  max_mentees?: number;
  total_sessions: number;
  avg_rating: number;
  review_count: number;
  is_active: boolean;
  user?: Partial<User>;
}

export interface MentorBooking {
  booking_id: string;
  mentor_user_id: string;
  mentee_user_id: string;
  date: string;
  time_slot: string;
  topic: string;
  notes?: string;
  status: string;
  session_notes?: string;
  created_at: string;
  mentor?: Partial<User>;
  mentee?: Partial<User>;
}

export interface MentorReview {
  review_id: string;
  booking_id: string;
  mentor_user_id: string;
  reviewer_user_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

// Learning
export interface Course {
  course_id: string;
  title: string;
  description: string;
  level: string;
  duration_hours?: number;
  tags: string[];
  thumbnail?: string;
  creator_id: string;
  modules: CourseModule[];
  enrolled_count: number;
  avg_rating: number;
  is_published: boolean;
  user_progress?: CourseProgress;
}

export interface CourseModule {
  module_id: string;
  course_id: string;
  title: string;
  content_type: string;
  content: string;
  duration_minutes?: number;
  order: number;
}

export interface CourseProgress {
  user_id: string;
  course_id: string;
  progress_pct: number;
  completed_modules: string[];
  enrolled_at: string;
}

// Marketplace
export interface MarketplaceTool {
  tool_id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  logo?: string;
  pricing?: string;
  tags: string[];
  affiliate_url?: string;
  avg_rating: number;
  review_count: number;
  is_approved: boolean;
}

export interface ToolReview {
  review_id: string;
  tool_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  pros: string[];
  cons: string[];
  created_at: string;
}

// Events & Groups
export interface Event {
  event_id: string;
  title: string;
  description: string;
  event_type: string;
  location?: string;
  online_url?: string;
  start_time: string;
  end_time: string;
  max_attendees?: number;
  tags: string[];
  cover_image?: string;
  organizer_id: string;
  attendees_count: number;
  created_at: string;
  organizer?: Partial<User>;
}

export interface Group {
  group_id: string;
  name: string;
  description: string;
  rules?: string;
  is_private: boolean;
  tags: string[];
  cover_image?: string;
  creator_id: string;
  moderators: string[];
  members_count: number;
  created_at: string;
}

// Investor Flow
export interface InvestorWatchlist {
  watchlist_id: string;
  user_id: string;
  name: string;
  description?: string;
  startups: string[];
  created_at: string;
}

export interface PipelineItem {
  pipeline_id: string;
  investor_user_id: string;
  startup_id: string;
  stage: PipelineStage;
  notes?: string;
  next_action?: string;
  next_action_date?: string;
  history: PipelineHistory[];
  created_at: string;
  startup?: Organization;
}

export interface PipelineHistory {
  stage: PipelineStage;
  date: string;
  notes?: string;
}

// Messaging
export interface Conversation {
  conversation_id: string;
  type: string;
  participants: string[];
  participants_info?: Partial<User>[];
  last_message_at: string;
  last_message?: Message;
  unread_count: number;
  created_at: string;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: string[];
  read_by: string[];
  created_at: string;
}

export interface IntroRequest {
  request_id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: string;
  created_at: string;
  from_user?: Partial<User>;
  to_user?: Partial<User>;
}

// Connection
export interface Connection {
  connection_id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  is_sender: boolean;
  created_at: string;
  accepted_at?: string;
  other_user?: {
    user_id: string;
    name: string;
    email: string;
    role: UserRole;
    headline?: string;
    profile_image?: string;
    location?: string;
  };
}

// Posts
export interface Post {
  post_id: string;
  author_id: string;
  author_type: string;
  content: string;
  media: string[];
  tags: string[];
  visibility: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_liked: boolean;
  created_at: string;
  author?: {
    user_id: string;
    name: string;
    profile_image?: string;
    headline?: string;
    roles: UserRole[];
  };
  comments?: Comment[];
}

export interface Comment {
  comment_id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author?: Partial<User>;
}

// Notifications
export interface Notification {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// Auth
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  needs_onboarding?: boolean;
}

// AI Recommendation
export interface AIRecommendation {
  user: User;
  match_score: number;
  match_reason: string;
}

// Role display helpers
export const roleLabels: Record<UserRole, string> = {
  founder: 'Founder',
  investor: 'Investor',
  mentor: 'Mentor',
  service_provider: 'Service Provider',
  talent: 'Talent',
  startup_team: 'Startup Team',
  ecosystem_org: 'Ecosystem Org',
};

export const roleColors: Record<UserRole, string> = {
  founder: '#6366F1',
  investor: '#10B981',
  mentor: '#F59E0B',
  service_provider: '#EC4899',
  talent: '#8B5CF6',
  startup_team: '#06B6D4',
  ecosystem_org: '#EF4444',
};

export const roleIcons: Record<UserRole, string> = {
  founder: 'rocket',
  investor: 'cash-outline',
  mentor: 'school-outline',
  service_provider: 'briefcase-outline',
  talent: 'person-outline',
  startup_team: 'people-outline',
  ecosystem_org: 'business-outline',
};

export const stageLabels: Record<StartupStage, string> = {
  idea: 'Idea',
  mvp: 'MVP',
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B',
  series_c: 'Series C',
  growth: 'Growth',
  ipo: 'IPO',
};

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  cofounder: 'Co-Founder',
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  freelance: 'Freelance',
  internship: 'Internship',
  advisor: 'Advisor',
};

export const compensationLabels: Record<CompensationType, string> = {
  salary: 'Salary',
  equity: 'Equity',
  mixed: 'Salary + Equity',
  unpaid: 'Unpaid',
};
