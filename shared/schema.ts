import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  unique,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  middleName: varchar("middle_name"),
  preferredName: varchar("preferred_name"),
  profileImageUrl: varchar("profile_image_url"),
  profileBannerUrl: varchar("profile_banner_url"),
  bio: text("bio"),
  website: varchar("website"),
  socialLinks: jsonb("social_links").default("{}"),
  interests: text("interests").array(),
  politicalInterests: text("political_interests").array(),
  civicInterests: text("civic_interests").array(),
  politicalAffiliation: varchar("political_affiliation"),
  occupation: varchar("occupation"),
  education: varchar("education"),
  electoralDistrict: varchar("electoral_district"),
  phoneNumber: varchar("phone_number"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender"),
  maritalStatus: varchar("marital_status"),
  governmentIdVerified: boolean("government_id_verified").default(false),
  governmentIdType: varchar("government_id_type"),
  verificationLevel: varchar("verification_level").default("unverified"),
  communicationStyle: varchar("communication_style").default("auto"),
  isVerified: boolean("is_verified").default(false),
  civicLevel: varchar("civic_level").default("Registered"),
  trustScore: decimal("trust_score", { precision: 5, scale: 2 }).default("100.00"),
  // Geolocation
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  city: varchar("city"),
  province: varchar("province"),
  postalCode: varchar("postal_code"),
  country: varchar("country").default("Canada"),
  streetAddress: varchar("street_address"),
  apartmentUnit: varchar("apartment_unit"),
  federalRiding: varchar("federal_riding"),
  provincialRiding: varchar("provincial_riding"),
  municipalWard: varchar("municipal_ward"),
  addressVerified: boolean("address_verified").default(false),
  addressVerifiedAt: timestamp("address_verified_at"),
  addressVerificationMethod: varchar("address_verification_method"),
  locationAccuracy: integer("location_accuracy"),
  locationTimestamp: timestamp("location_timestamp"),
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  authenticationHistory: jsonb("authentication_history"),
  profileCompleteness: integer("profile_completeness").default(0),
  identityVerificationScore: decimal("identity_verification_score", { precision: 5, scale: 2 }).default("0.00"),
  residencyVerified: boolean("residency_verified").default(false),
  citizenshipStatus: varchar("citizenship_status"),
  voterRegistrationStatus: varchar("voter_registration_status"),
  // Emergency contact
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  emergencyContactRelationship: varchar("emergency_contact_relationship"),
  // Professional info
  employer: varchar("employer"),
  jobTitle: varchar("job_title"),
  industry: varchar("industry"),
  yearsOfExperience: integer("years_of_experience"),
  highestEducation: varchar("highest_education"),
  almaMater: varchar("alma_mater"),
  graduationYear: integer("graduation_year"),
  // Political engagement
  politicalExperience: text("political_experience"),
  campaignExperience: text("campaign_experience"),
  volunteerExperience: text("volunteer_experience"),
  advocacyAreas: text("advocacy_areas").array(),
  policyInterests: text("policy_interests").array(),
  // Security
  identityDocumentType: varchar("identity_document_type"),
  identityDocumentNumber: varchar("identity_document_number"),
  identityVerifiedAt: timestamp("identity_verified_at"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorMethod: varchar("two_factor_method"),
  lastLoginIp: varchar("last_login_ip"),
  lastLoginUserAgent: text("last_login_user_agent"),
  // Preferences
  emailPreferences: jsonb("email_preferences").default("{}"),
  notificationPreferences: jsonb("notification_preferences").default("{}"),
  privacySettings: jsonb("privacy_settings").default("{}"),
  // Membership
  membershipType: varchar("membership_type").default("citizen"),
  membershipStatus: varchar("membership_status").default("active"),
  membershipStartDate: timestamp("membership_start_date"),
  membershipEndDate: timestamp("membership_end_date"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  accessLevel: varchar("access_level").default("basic"),
  featureAccess: jsonb("feature_access").default("{}"),
  usageLimits: jsonb("usage_limits").default("{}"),
  // Gamification
  civicPoints: integer("civic_points").default(0),
  currentLevel: integer("current_level").default(1),
  totalBadges: integer("total_badges").default(0),
  streakDays: integer("streak_days").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  achievementTier: varchar("achievement_tier").default("bronze"),
  politicalAwarenessScore: decimal("political_awareness_score", { precision: 5, scale: 2 }).default("0.00"),
  engagementLevel: varchar("engagement_level").default("newcomer"),
  monthlyGoal: integer("monthly_goal").default(100),
  yearlyGoal: integer("yearly_goal").default(1200),
  // Profile customization
  profileTheme: varchar("profile_theme").default("default"),
  profileAccentColor: varchar("profile_accent_color").default("#3b82f6"),
  profileBioVisibility: varchar("profile_bio_visibility").default("public"),
  profileLocationVisibility: varchar("profile_location_visibility").default("public"),
  profileStatsVisibility: varchar("profile_stats_visibility").default("public"),
  profilePostsVisibility: varchar("profile_posts_visibility").default("public"),
  profileCustomFields: jsonb("profile_custom_fields"),
  profileLayout: varchar("profile_layout").default("standard"),
  profileShowBadges: boolean("profile_show_badges").default(true),
  profileShowStats: boolean("profile_show_stats").default(true),
  profileShowActivity: boolean("profile_show_activity").default(true),
  profileShowFriends: boolean("profile_show_friends").default(true),
  profileShowPosts: boolean("profile_show_posts").default(true),
  profileLastUpdated: timestamp("profile_last_updated"),
  profileVisibility: varchar("profile_visibility").default("public"),
  profileCompletionPercentage: integer("profile_completion_percentage").default(0),
  // Social metrics
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  postsCount: integer("posts_count").default(0),
  commentsCount: integer("comments_count").default(0),
  likesCount: integer("likes_count").default(0),
  sharesCount: integer("shares_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  accountStatus: varchar("account_status").default("active"),
  suspendedUntil: timestamp("suspended_until"),
  suspensionReason: text("suspension_reason"),
});

// Users blocking other users
export const userBlocks = pgTable(
  "user_blocks",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull(),
    blockedUserId: varchar("blocked_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("uniq_user_blocks").on(table.userId, table.blockedUserId),
    index("idx_user_blocks_user").on(table.userId),
    index("idx_user_blocks_blocked").on(table.blockedUserId),
  ]
);

// Politicians table
export const politicians = pgTable("politicians", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  party: varchar("party"),
  position: varchar("position"),
  riding: varchar("riding"),
  image: varchar("image"),
  parliamentMemberId: varchar("parliament_member_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  partyAffiliation: varchar("party_affiliation"),
  constituency: varchar("constituency"),
  electionDate: date("election_date"),
  termStart: date("term_start"),
  termEnd: date("term_end"),
  isIncumbent: boolean("is_incumbent").default(false),
  biography: text("biography"),
  contactInfo: jsonb("contact_info").default("{}"),
  socialMedia: jsonb("social_media").default("{}"),
  votingRecord: jsonb("voting_record").default("{}"),
  level: varchar("level"),
  jurisdiction: varchar("jurisdiction"),
  trustScore: decimal("trust_score", { precision: 5, scale: 2 }).default("50.00"),
  civicLevel: varchar("civic_level"),
  recentActivity: text("recent_activity"),
  policyPositions: text("policy_positions").array(),
  expenses: jsonb("expenses").default("{}"),
  committees: text("committees").array(),
  bio: text("bio"),
  officeAddress: varchar("office_address"),
});

// Social posts table
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  imageUrl: varchar("image_url"),
  type: varchar("type").default("post"),
  originalItemId: integer("original_item_id"),
  originalItemType: varchar("original_item_type"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  visibility: varchar("visibility").default("public"),
  tags: text("tags").array(),
  location: varchar("location"),
  mood: varchar("mood"),
});

// Social comments table
export const socialComments = pgTable("social_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentCommentId: integer("parent_comment_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social likes table
export const socialLikes = pgTable("social_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  reaction: varchar("reaction").default("like"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comment likes table
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  commentId: integer("comment_id").notNull().references(() => socialComments.id, { onDelete: "cascade" }),
  reaction: varchar("reaction").default("like"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social Shares table
export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(),
  sharedAt: timestamp("shared_at").defaultNow(),
});

// Social Bookmarks table
export const socialBookmarks = pgTable("social_bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  bookmarkedAt: timestamp("bookmarked_at").defaultNow(),
});

// User friends table
export const userFriends = pgTable("user_friends", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  friendId: varchar("friend_id").notNull(),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User messages table
export const userMessages = pgTable("user_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  subject: varchar("subject"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activities table
export const userActivity = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(),
  description: text("description"),
  data: jsonb("data"),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"),
  sourceModule: varchar("source_module"),
  createdAt: timestamp("created_at").defaultNow(),
  sourceId: varchar("source_id"),
});

// Bills table
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  sponsorId: varchar("sponsor_id"),
  sponsorName: varchar("sponsor_name"),
  billType: varchar("bill_type"),
  status: varchar("status").default("introduced"),
  introducedDate: date("introduced_date"),
  passedDate: date("passed_date"),
  enactedDate: date("enacted_date"),
  summary: text("summary"),
  fullText: text("full_text"),
  committeeReferral: varchar("committee_referral"),
  fiscalImpact: text("fiscal_impact"),
  billNumber: varchar("bill_number"),
  votingDeadline: timestamp("voting_deadline"),
  deadlineDate: timestamp("deadline_date"),
  aiSummary: text("ai_summary"),
  category: varchar("category"),
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull(),
  userId: varchar("user_id").notNull(),
  vote: varchar("vote").notNull(), // yes, no, abstain
  reason: text("reason"),
  itemId: integer("item_id"),
  itemType: varchar("item_type"),
  voteValue: integer("vote_value"),
  reasoning: text("reasoning"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  verificationId: varchar("verification_id"),
});

// News articles table
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content"),
  url: varchar("url").unique(),
  source: varchar("source"),
  author: varchar("author"),
  category: varchar("category"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  summary: text("summary"),
  bias: varchar("bias"),
  credibilityScore: decimal("credibility_score", { precision: 3, scale: 2 }),
});

// News comparisons table
export const newsComparisons = pgTable("news_comparisons", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  comparisonData: jsonb("comparison_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Propaganda detection table
export const propagandaDetection = pgTable("propaganda_detection", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  detectionResults: jsonb("detection_results"),
  createdAt: timestamp("created_at").defaultNow(),
});

// News source credibility table
export const newsSourceCredibility = pgTable("news_source_credibility", {
  id: serial("id").primaryKey(),
  sourceName: varchar("source_name").notNull(),
  credibilityScore: decimal("credibility_score", { precision: 3, scale: 2 }),
  biasRating: varchar("bias_rating"),
  factCheckRating: varchar("fact_check_rating"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Electoral candidates table
export const electoralCandidates = pgTable("electoral_candidates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  party: varchar("party"),
  riding: varchar("riding"),
  electionId: integer("election_id"),
  bio: text("bio"),
  platform: jsonb("platform"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Electoral votes table
export const electoralVotes = pgTable("electoral_votes", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  userId: varchar("user_id").notNull(),
  vote: varchar("vote").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  voteType: varchar("vote_type"),
  reasoning: text("reasoning"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Elections table
export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  date: timestamp("date").notNull(),
  type: varchar("type").notNull(),
  jurisdiction: varchar("jurisdiction").notNull(),
  status: varchar("status").default("upcoming"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  party: varchar("party"),
  riding: varchar("riding"),
  electionId: integer("election_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidate policies table
export const candidatePolicies = pgTable("candidate_policies", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  policyArea: varchar("policy_area"),
  policyDescription: text("policy_description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Electoral districts table
export const electoralDistricts = pgTable("electoral_districts", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  jurisdiction: varchar("jurisdiction").notNull(),
  population: integer("population"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  districtName: varchar("district_name"),
  districtNumber: varchar("district_number"),
  province: varchar("province"),
  area: varchar("area"),
  majorCities: text("major_cities").array(),
  currentRepresentative: varchar("current_representative"),
  lastElectionTurnout: varchar("last_election_turnout"),
  isUrban: boolean("is_urban"),
  isRural: boolean("is_rural"),
});

// Criminal code sections table
export const criminalCodeSections = pgTable("criminal_code_sections", {
  id: serial("id").primaryKey(),
  sectionNumber: varchar("section_number").notNull(),
  title: varchar("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  source: varchar("source"),
  sourceUrl: varchar("source_url"),
  lastUpdated: timestamp("last_updated"),
});

// Legal acts table
export const legalActs = pgTable("legal_acts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  actNumber: varchar("act_number"),
  content: text("content"),
  jurisdiction: varchar("jurisdiction"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  fullText: text("full_text"),
  summary: text("summary"),
  source: varchar("source"),
  sourceUrl: varchar("source_url"),
  lastUpdated: timestamp("last_updated"),
});

// Legal cases table
export const legalCases = pgTable("legal_cases", {
  id: serial("id").primaryKey(),
  caseNumber: varchar("case_number").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  summary: text("summary"),
  jurisdiction: varchar("jurisdiction"),
  status: varchar("status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  source: varchar("source"),
  sourceUrl: varchar("source_url"),
  lastUpdated: timestamp("last_updated"),
});

// Legislative acts table
export const legislativeActs = pgTable("legislative_acts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  actNumber: varchar("act_number"),
  content: text("content"),
  jurisdiction: varchar("jurisdiction"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Politician statements table
export const politicianStatements = pgTable("politician_statements", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id, { onDelete: "cascade" }),
  statement: text("statement").notNull(),
  context: text("context"),
  date: timestamp("date").notNull(),
  source: varchar("source"),
  createdAt: timestamp("created_at").defaultNow(),
  dateCreated: timestamp("date_created").defaultNow(),
});

// Politician positions table
export const politicianPositions = pgTable("politician_positions", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id, { onDelete: "cascade" }),
  position: varchar("position").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  dateStated: timestamp("date_stated").defaultNow(),
});

// Campaign finance table
export const campaignFinance = pgTable("campaign_finance", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  source: varchar("source"),
  date: timestamp("date"),
  type: varchar("type"),
  createdAt: timestamp("created_at").defaultNow(),
  reportingPeriod: timestamp("reporting_period"),
});

// Politician truth tracking table
export const politicianTruthTracking = pgTable("politician_truth_tracking", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id, { onDelete: "cascade" }),
  statementId: integer("statement_id"),
  truthScore: decimal("truth_score", { precision: 3, scale: 2 }),
  factCheckResult: varchar("fact_check_result"),
  createdAt: timestamp("created_at").defaultNow(),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// Parliament members (official Our Commons directory)
export const parliamentMembers = pgTable("parliament_members", {
  memberId: varchar("member_id").primaryKey(),
  name: varchar("name").notNull(),
  party: varchar("party"),
  constituency: varchar("constituency"),
  province: varchar("province"),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  imageUrl: varchar("image_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bill roll-call votes (per bill number per vote event)
export const billRollcalls = pgTable("bill_rollcalls", {
  id: serial("id").primaryKey(),
  parliament: integer("parliament"),
  session: varchar("session"),
  billNumber: varchar("bill_number").notNull(),
  voteNumber: integer("vote_number"),
  result: varchar("result"),
  dateTime: timestamp("date_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Member decisions for a roll call
export const billRollcallRecords = pgTable("bill_rollcall_records", {
  id: serial("id").primaryKey(),
  rollcallId: integer("rollcall_id").notNull(),
  memberId: varchar("member_id").notNull(),
  decision: varchar("decision").notNull(), // yes, no, abstain, paired
  party: varchar("party"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Procurement contracts via CKAN/Open Government
export const procurementContracts = pgTable("procurement_contracts", {
  id: serial("id").primaryKey(),
  reference: varchar("reference").unique(),
  supplier: varchar("supplier"),
  department: varchar("department"),
  value: decimal("value", { precision: 12, scale: 2 }),
  awardedOn: timestamp("awarded_on"),
  url: varchar("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lobbyist organizations (curated/CKAN-backed)
export const lobbyistOrgs = pgTable("lobbyist_orgs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  clients: jsonb("clients"),
  sectors: text("sectors").array(),
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Petitions table
export const petitions = pgTable("petitions", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull(),
  category: varchar("category"),
  jurisdiction: varchar("jurisdiction"),
  targetSignatures: integer("target_signatures"),
  currentSignatures: integer("current_signatures").default(0),
  status: varchar("status").default("active"),
  urgency: varchar("urgency"),
  verified: boolean("verified").default(false),
  image: text("image"),
  tags: text("tags").array(),
  supporters: jsonb("supporters"),
  deadline: varchar("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  relatedBillId: integer("related_bill_id"),
  autoCreated: boolean("auto_created").default(false),
  deadlineDate: timestamp("deadline_date"),
  source: varchar("source"),
  sourceUrl: varchar("source_url"),
  lastUpdated: timestamp("last_updated"),
});

// Petition signatures table
export const petitionSignatures = pgTable("petition_signatures", {
  id: serial("id").primaryKey(),
  petitionId: integer("petition_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  signedAt: timestamp("signed_at").defaultNow(),
  verificationId: varchar("verification_id"),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").default("general"),
  priority: varchar("priority").default("normal"),
  isActive: boolean("is_active").default(true),
  authorId: varchar("author_id"),
  authorName: varchar("author_name"),
  authorMembershipType: varchar("author_membership_type").default("citizen"),
  status: varchar("status").default("published"),
  targetAudience: varchar("target_audience").default("all"),
  isPinned: boolean("is_pinned").default(false),
  viewsCount: integer("views_count").default(0),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User permissions table
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  permissionName: varchar("permission_name").notNull(), // Add this field for direct permission name lookup
  isGranted: boolean("is_granted").default(true), // Add this field
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: varchar("granted_by"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"),
  isActive: boolean("is_active").default(true), // Add this field
  createdAt: timestamp("created_at").defaultNow(),
});

// Membership permissions table
export const membershipPermissions = pgTable("membership_permissions", {
  id: serial("id").primaryKey(),
  membershipType: varchar("membership_type").notNull(),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  permissionName: varchar("permission_name").notNull(), // Add this field for direct permission name lookup
  isGranted: boolean("is_granted").default(true), // Add this field
  createdAt: timestamp("created_at").defaultNow(),
});

// User membership history table
export const userMembershipHistory = pgTable("user_membership_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  membershipType: varchar("membership_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  reason: varchar("reason"),
  createdAt: timestamp("created_at").defaultNow(),
  status: varchar("status").default("active"),
});

// Fact checks table
export const factChecks = pgTable("fact_checks", {
  id: serial("id").primaryKey(),
  statement: text("statement").notNull(),
  politicianId: varchar("politician_id"),
  factCheckResult: varchar("fact_check_result"),
  accuracy: decimal("accuracy", { precision: 3, scale: 2 }),
  source: varchar("source"),
  createdAt: timestamp("created_at").defaultNow(),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// User notification preferences table
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  notificationTypes: jsonb("notification_types").default("{}"),
  quietHours: jsonb("quiet_hours").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voting items table
export const votingItems = pgTable("voting_items", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // bill, motion, resolution, etc.
  options: jsonb("options").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status").notNull(),
  jurisdiction: varchar("jurisdiction").notNull(),
  requiredQuorum: integer("required_quorum").default(0),
  eligibleVoters: jsonb("eligible_voters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User follows table
export const userFollows = pgTable("user_follows", {
  id: serial("id"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followId: varchar("follow_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
(table) => [
  primaryKey({ columns: [table.userId, table.followId] }), // Prevent duplicate follows
  index("IDX_user_follows_user_id").on(table.userId),
  index("IDX_user_follows_follow_id").on(table.followId),
  index("IDX_user_follows_created_at").on(table.createdAt),
]);

// Create schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertPoliticianSchema = createInsertSchema(politicians);
export const insertSocialPostSchema = createInsertSchema(socialPosts);
export const insertSocialCommentSchema = createInsertSchema(socialComments);
export const insertSocialLikeSchema = createInsertSchema(socialLikes);
export const insertUserFriendSchema = createInsertSchema(userFriends);
export const insertUserMessageSchema = createInsertSchema(userMessages);
export const insertUserActivitySchema = createInsertSchema(userActivity);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertBillSchema = createInsertSchema(bills);
export const insertVoteSchema = createInsertSchema(votes);
export const insertNewsArticleSchema = createInsertSchema(newsArticles);
export const insertNewsComparisonSchema = createInsertSchema(newsComparisons);
export const insertPropagandaDetectionSchema = createInsertSchema(propagandaDetection);
export const insertNewsSourceCredibilitySchema = createInsertSchema(newsSourceCredibility);
export const insertElectoralCandidateSchema = createInsertSchema(electoralCandidates);
export const insertElectoralVoteSchema = createInsertSchema(electoralVotes);
export const insertElectionSchema = createInsertSchema(elections);
export const insertCandidateSchema = createInsertSchema(candidates);
export const insertCandidatePolicySchema = createInsertSchema(candidatePolicies);
export const insertElectoralDistrictSchema = createInsertSchema(electoralDistricts);
export const insertCriminalCodeSectionSchema = createInsertSchema(criminalCodeSections);
export const insertLegalActSchema = createInsertSchema(legalActs);
export const insertLegalCaseSchema = createInsertSchema(legalCases);
export const insertLegislativeActSchema = createInsertSchema(legislativeActs);
export const insertPoliticianStatementSchema = createInsertSchema(politicianStatements);
export const insertPoliticianPositionSchema = createInsertSchema(politicianPositions);
export const insertCampaignFinanceSchema = createInsertSchema(campaignFinance);
export const insertPoliticianTruthTrackingSchema = createInsertSchema(politicianTruthTracking);
export const insertPetitionSchema = createInsertSchema(petitions);
export const insertPetitionSignatureSchema = createInsertSchema(petitionSignatures);
export const insertAnnouncementSchema = createInsertSchema(announcements);
export const insertUserPermissionSchema = createInsertSchema(userPermissions);
export const insertPermissionSchema = createInsertSchema(permissions);
export const insertMembershipPermissionSchema = createInsertSchema(membershipPermissions);
export const insertUserMembershipHistorySchema = createInsertSchema(userMembershipHistory);
export const insertFactCheckSchema = createInsertSchema(factChecks);

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = InsertUser;
export type Politician = typeof politicians.$inferSelect;
export type InsertPolitician = typeof politicians.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;
export type SocialComment = typeof socialComments.$inferSelect;
export type InsertSocialComment = typeof socialComments.$inferInsert;
export type SocialLike = typeof socialLikes.$inferSelect;
export type InsertSocialLike = typeof socialLikes.$inferInsert;
export type UserFriend = typeof userFriends.$inferSelect;
export type InsertUserFriend = typeof userFriends.$inferInsert;
export type UserMessage = typeof userMessages.$inferSelect;
export type InsertUserMessage = typeof userMessages.$inferInsert;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = typeof bills.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = typeof newsArticles.$inferInsert;
export type NewsComparison = typeof newsComparisons.$inferSelect;
export type InsertNewsComparison = typeof newsComparisons.$inferInsert;
export type PropagandaDetection = typeof propagandaDetection.$inferSelect;
export type InsertPropagandaDetection = typeof propagandaDetection.$inferInsert;
export type NewsSourceCredibility = typeof newsSourceCredibility.$inferSelect;
export type InsertNewsSourceCredibility = typeof newsSourceCredibility.$inferInsert;
export type ElectoralCandidate = typeof electoralCandidates.$inferSelect;
export type InsertElectoralCandidate = typeof electoralCandidates.$inferInsert;
export type ElectoralVote = typeof electoralVotes.$inferSelect;
export type InsertElectoralVote = typeof electoralVotes.$inferInsert;
export type Election = typeof elections.$inferSelect;
export type InsertElection = typeof elections.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;
export type CandidatePolicy = typeof candidatePolicies.$inferSelect;
export type InsertCandidatePolicy = typeof candidatePolicies.$inferInsert;
export type ElectoralDistrict = typeof electoralDistricts.$inferSelect;
export type InsertElectoralDistrict = typeof electoralDistricts.$inferInsert;
export type CriminalCodeSection = typeof criminalCodeSections.$inferSelect;
export type InsertCriminalCodeSection = typeof criminalCodeSections.$inferInsert;
export type LegalAct = typeof legalActs.$inferSelect;
export type InsertLegalAct = typeof legalActs.$inferInsert;
export type LegalCase = typeof legalCases.$inferSelect;
export type InsertLegalCase = typeof legalCases.$inferInsert;
export type LegislativeAct = typeof legislativeActs.$inferSelect;
export type InsertLegislativeAct = typeof legislativeActs.$inferInsert;
export type PoliticianStatement = typeof politicianStatements.$inferSelect;
export type InsertPoliticianStatement = typeof politicianStatements.$inferInsert;
export type PoliticianPosition = typeof politicianPositions.$inferSelect;
export type InsertPoliticianPosition = typeof politicianPositions.$inferInsert;
export type CampaignFinance = typeof campaignFinance.$inferSelect;
export type InsertCampaignFinance = typeof campaignFinance.$inferInsert;
export type PoliticianTruthTracking = typeof politicianTruthTracking.$inferSelect;
export type InsertPoliticianTruthTracking = typeof politicianTruthTracking.$inferInsert;
export type Petition = typeof petitions.$inferSelect;
export type InsertPetition = typeof petitions.$inferInsert;
export type PetitionSignature = typeof petitionSignatures.$inferSelect;
export type InsertPetitionSignature = typeof petitionSignatures.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;
export type MembershipPermission = typeof membershipPermissions.$inferSelect;
export type InsertMembershipPermission = typeof membershipPermissions.$inferInsert;
export type UserMembershipHistory = typeof userMembershipHistory.$inferSelect;
export type InsertUserMembershipHistory = typeof userMembershipHistory.$inferInsert;
export type FactCheck = typeof factChecks.$inferSelect;
export type InsertFactCheck = typeof factChecks.$inferInsert;
export type ParliamentMember = typeof parliamentMembers.$inferSelect;
export type InsertParliamentMember = typeof parliamentMembers.$inferInsert;
export type BillRollcall = typeof billRollcalls.$inferSelect;
export type InsertBillRollcall = typeof billRollcalls.$inferInsert;
export type BillRollcallRecord = typeof billRollcallRecords.$inferSelect;
export type InsertBillRollcallRecord = typeof billRollcallRecords.$inferInsert;
export type ProcurementContract = typeof procurementContracts.$inferSelect;
export type InsertProcurementContract = typeof procurementContracts.$inferInsert;
export type LobbyistOrg = typeof lobbyistOrgs.$inferSelect;
export type InsertLobbyistOrg = typeof lobbyistOrgs.$inferInsert;
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = typeof userNotificationPreferences.$inferInsert;
export type VotingItem = typeof votingItems.$inferSelect;
export type InsertVotingItem = typeof votingItems.$inferInsert;