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
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  electoralDistrict: varchar("electoral_district"),
  phoneNumber: varchar("phone_number"),
  dateOfBirth: timestamp("date_of_birth"),
  governmentIdVerified: boolean("government_id_verified").default(false),
  governmentIdType: varchar("government_id_type"), // passport, drivers_license, health_card
  verificationLevel: varchar("verification_level").default("unverified"), // unverified, basic, government_id, enhanced
  communicationStyle: varchar("communication_style").default("auto"), // auto, simple, casual, formal, technical
  isVerified: boolean("is_verified").default(false),
  civicLevel: varchar("civic_level").default("Registered"),
  trustScore: decimal("trust_score", { precision: 5, scale: 2 }).default("100.00"),
  // Enhanced geolocation and profile validation
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  city: varchar("city"),
  province: varchar("province"),
  postalCode: varchar("postal_code"),
  country: varchar("country").default("Canada"),
  federalRiding: varchar("federal_riding"),
  provincialRiding: varchar("provincial_riding"),
  municipalWard: varchar("municipal_ward"),
  addressVerified: boolean("address_verified").default(false),
  locationAccuracy: integer("location_accuracy"), // GPS accuracy in meters
  locationTimestamp: timestamp("location_timestamp"),
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  authenticationHistory: jsonb("authentication_history"),
  profileCompleteness: integer("profile_completeness").default(0), // percentage 0-100
  identityVerificationScore: decimal("identity_verification_score", { precision: 5, scale: 2 }).default("0.00"),
  residencyVerified: boolean("residency_verified").default(false),
  citizenshipStatus: varchar("citizenship_status"), // citizen, permanent_resident, temporary_resident, visitor
  voterRegistrationStatus: varchar("voter_registration_status"), // registered, not_registered, unknown
  // Gamification features
  civicPoints: integer("civic_points").default(0),
  currentLevel: integer("current_level").default(1),
  totalBadges: integer("total_badges").default(0),
  streakDays: integer("streak_days").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  achievementTier: varchar("achievement_tier").default("bronze"), // bronze, silver, gold, platinum, diamond
  politicalAwarenessScore: decimal("political_awareness_score", { precision: 5, scale: 2 }).default("0.00"),
  engagementLevel: varchar("engagement_level").default("newcomer"), // newcomer, active, advocate, expert, champion
  monthlyGoal: integer("monthly_goal").default(100), // civic points goal
  yearlyGoal: integer("yearly_goal").default(1200),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gamification badges and achievements
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  category: varchar("category"), // civic_engagement, knowledge, voting, advocacy, social
  rarity: varchar("rarity").default("common"), // common, rare, epic, legendary
  pointsRequired: integer("points_required").default(0),
  criteria: jsonb("criteria"), // complex achievement criteria
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  badgeId: integer("badge_id").references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
  progress: integer("progress").default(0), // for progressive badges
  isCompleted: boolean("is_completed").default(true),
  notificationSent: boolean("notification_sent").default(false),
});

export const civicActivities = pgTable("civic_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  activityType: varchar("activity_type").notNull(), // vote, petition_sign, bill_read, discussion, contact_politician
  points: integer("points").default(0),
  description: text("description"),
  relatedId: integer("related_id"), // bill_id, petition_id, etc.
  relatedType: varchar("related_type"), // bill, petition, discussion, politician
  metadata: jsonb("metadata"), // additional activity data
  verificationLevel: varchar("verification_level").default("automatic"), // automatic, manual, verified
  timestamp: timestamp("timestamp").defaultNow(),
});

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category"), // voting, learning, engagement, advocacy
  pointsReward: integer("points_reward").default(50),
  difficulty: varchar("difficulty").default("easy"), // easy, medium, hard
  criteria: jsonb("criteria"), // challenge completion criteria
  validDate: timestamp("valid_date").notNull(),
  isActive: boolean("is_active").default(true),
  participantCount: integer("participant_count").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default("0.00"),
});

export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  challengeId: integer("challenge_id").references(() => dailyChallenges.id),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").default(1),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  pointsEarned: integer("points_earned").default(0),
});

export const leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  category: varchar("category").notNull(), // weekly_points, monthly_points, all_time, badges, streak
  rank: integer("rank"),
  score: integer("score"),
  period: varchar("period"), // weekly, monthly, yearly, all_time
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Bills/Legislation table
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNumber: varchar("bill_number").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  fullText: text("full_text"),
  aiSummary: text("ai_summary"),
  category: varchar("category"),
  jurisdiction: varchar("jurisdiction").notNull(), // Federal, Provincial, Municipal
  status: varchar("status").default("Active"), // Active, Passed, Failed, Withdrawn
  votingDeadline: timestamp("voting_deadline"),
  dateIntroduced: timestamp("date_introduced"),
  sponsor: varchar("sponsor"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Universal votes table - supports voting on any content type
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull(), // ID of the item being voted on
  itemType: varchar("item_type").notNull(), // "bill", "politician", "petition", "news", "comment"
  voteValue: integer("vote_value").notNull(), // 1 for upvote/like, -1 for downvote/dislike, 0 for abstain
  reasoning: text("reasoning"),
  verificationId: varchar("verification_id").notNull().unique(),
  blockHash: varchar("block_hash").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isVerified: boolean("is_verified").default(true),
});

// Politicians table
export const politicians = pgTable("politicians", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  position: varchar("position").notNull(),
  party: varchar("party"),
  jurisdiction: varchar("jurisdiction").notNull(),
  constituency: varchar("constituency"),
  level: varchar("level"), // Federal, Provincial, Municipal
  contact: jsonb("contact"), // contact information
  email: varchar("email"),
  phone: varchar("phone"),
  office_address: varchar("office_address"),
  website: varchar("website"),
  trustScore: decimal("trust_score", { precision: 5, scale: 2 }).default("50.00"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Politician statements for tracking consistency
export const politicianStatements = pgTable("politician_statements", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id),
  statement: text("statement").notNull(),
  context: varchar("context"), // debate, press release, etc.
  source: varchar("source"),
  dateCreated: timestamp("date_created").defaultNow(),
  isContradiction: boolean("is_contradiction").default(false),
  contradictionDetails: text("contradiction_details"),
});

// Petitions table for citizen-initiated petitions
export const petitions = pgTable("petitions", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  relatedBillId: integer("related_bill_id").references(() => bills.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  targetSignatures: integer("target_signatures").default(500), // Canadian e-petition minimum
  currentSignatures: integer("current_signatures").default(0),
  status: varchar("status").default("active"), // active, closed, successful
  autoCreated: boolean("auto_created").default(false), // true if created from vote threshold
  voteThresholdMet: timestamp("vote_threshold_met"),
  deadlineDate: timestamp("deadline_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Petition signatures tracking
export const petitionSignatures = pgTable("petition_signatures", {
  id: serial("id").primaryKey(),
  petitionId: integer("petition_id").notNull().references(() => petitions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  signedAt: timestamp("signed_at").defaultNow(),
  verificationId: varchar("verification_id").notNull(),
}, (table) => ({
  uniqueSignature: unique().on(table.petitionId, table.userId),
}));

// Enhanced politicians table with party and sector information
export const politicianParties = pgTable("politician_parties", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  abbreviation: varchar("abbreviation"),
  ideology: varchar("ideology"), // conservative, liberal, progressive, etc.
  color: varchar("color"), // for UI display
  description: text("description"),
  website: varchar("website"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comprehensive legal system tables
export const legalActs = pgTable("legal_acts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  shortTitle: varchar("short_title"),
  actNumber: varchar("act_number").notNull().unique(),
  jurisdiction: varchar("jurisdiction").notNull(), // federal, provincial, municipal
  province: varchar("province"), // if provincial
  category: varchar("category").notNull(), // criminal, civil, constitutional, etc.
  status: varchar("status").default("active"), // active, repealed, amended
  dateEnacted: timestamp("date_enacted"),
  lastAmended: timestamp("last_amended"),
  fullText: text("full_text"),
  summary: text("summary"),
  keyProvisions: text("key_provisions").array(),
  relatedActs: varchar("related_acts").array(),
  sourceUrl: varchar("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const legalSections = pgTable("legal_sections", {
  id: serial("id").primaryKey(),
  actId: integer("act_id").notNull().references(() => legalActs.id),
  sectionNumber: varchar("section_number").notNull(),
  title: varchar("title"),
  content: text("content").notNull(),
  subsections: jsonb("subsections"), // array of subsection objects
  penalties: text("penalties"),
  explanationSimple: text("explanation_simple"), // plain language explanation
  realWorldExamples: text("real_world_examples").array(),
  relatedSections: varchar("related_sections").array(),
  precedentCases: jsonb("precedent_cases"), // array of case objects
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // petition, bill, foi, system, politician
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  sourceModule: varchar("source_module").notNull(), // specific source like "Petition #123", "Bill C-11"
  sourceId: varchar("source_id"), // ID of the related item
  isRead: boolean("is_read").default(false),
  isDeleted: boolean("is_deleted").default(false), // soft delete
  priority: varchar("priority").default("medium"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User notification preferences table
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  petitionAlerts: boolean("petition_alerts").default(true),
  billUpdates: boolean("bill_updates").default(true),
  foiResponses: boolean("foi_responses").default(true),
  systemNews: boolean("system_news").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add missing politician controversies table
export const politicianControversies = pgTable("politician_controversies", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // ethics, scandal, policy_flip, etc.
  severity: varchar("severity").default("medium"), // low, medium, high, critical
  dateOccurred: timestamp("date_occurred"),
  sourceUrl: varchar("source_url"),
  verified: boolean("verified").default(false),
  impactScore: integer("impact_score").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add missing legislative acts table (aliased from legalActs)
export const legislativeActs = legalActs;

export const legalCases = pgTable("legal_cases", {
  id: serial("id").primaryKey(),
  caseName: varchar("case_name").notNull(),
  caseNumber: varchar("case_number"),
  court: varchar("court").notNull(),
  jurisdiction: varchar("jurisdiction").notNull(),
  dateDecided: timestamp("date_decided"),
  judge: varchar("judge"),
  parties: jsonb("parties"), // plaintiff, defendant info
  summary: text("summary"),
  ruling: text("ruling"),
  precedentSet: text("precedent_set"),
  relatedActIds: integer("related_act_ids").array(),
  relatedSectionIds: integer("related_section_ids").array(),
  keyQuotes: text("key_quotes").array(),
  significance: varchar("significance"), // landmark, routine, controversial
  sourceUrl: varchar("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const criminalCodeSections = pgTable("criminal_code_sections", {
  id: serial("id").primaryKey(),
  sectionNumber: varchar("section_number").notNull().unique(),
  title: varchar("title").notNull(),
  offense: varchar("offense"),
  content: text("content").notNull(),
  maxPenalty: varchar("max_penalty"),
  minPenalty: varchar("min_penalty"),
  isSummary: boolean("is_summary").default(false),
  isIndictable: boolean("is_indictable").default(false),
  isHybrid: boolean("is_hybrid").default(false),
  explanationSimple: text("explanation_simple"),
  commonExamples: text("common_examples").array(),
  defenses: text("defenses").array(),
  relatedSections: varchar("related_sections").array(),
  amendments: jsonb("amendments"), // history of changes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion forum system with subcategories
export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color"),
  icon: varchar("icon"),
  parentCategoryId: integer("parent_category_id"), // For subcategories
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  postCount: integer("post_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumSubcategories = pgTable("forum_subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => forumCategories.id),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color"),
  icon: varchar("icon"),
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  postCount: integer("post_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => forumCategories.id),
  subcategoryId: integer("subcategory_id").references(() => forumSubcategories.id),
  billId: integer("bill_id").references(() => bills.id), // if discussing a bill
  isSticky: boolean("is_sticky").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  replyCount: integer("reply_count").default(0),
  topic: varchar("topic"),
  moderationStatus: varchar("moderation_status"),
  moderationReason: varchar("moderation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id),
  parentReplyId: integer("parent_reply_id"), // remove self-reference for now
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  likeCount: integer("like_count").default(0),
  moderationStatus: varchar("moderation_status").default("approved"),
  moderationReason: varchar("moderation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumLikes = pgTable("forum_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: integer("post_id").references(() => forumPosts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniquePostLike: unique().on(table.userId, table.postId),
}));

export const forumReplyLikes = pgTable("forum_reply_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  replyId: integer("reply_id").notNull().references(() => forumReplies.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueReplyLike: unique().on(table.userId, table.replyId),
}));

// Unified voting system for all content types
export const userVotes = pgTable("user_votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetType: varchar("target_type").notNull(), // politician, bill, post, reply, comment, petition
  targetId: integer("target_id").notNull(),
  voteType: varchar("vote_type").notNull(), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserVote: unique().on(table.userId, table.targetType, table.targetId),
}));

// Vote counts aggregation table
export const voteCounts = pgTable("vote_counts", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  totalScore: integer("total_score").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueTarget: unique().on(table.targetType, table.targetId),
}));

// User interactions tracking
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  interactionType: varchar("interaction_type").notNull(), // vote, comment, share, view
  targetType: varchar("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  content: text("content"), // additional context like vote type
  createdAt: timestamp("created_at").defaultNow(),
});

// User messaging system
export const userMessages = pgTable("user_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  subject: varchar("subject"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  parentMessageId: integer("parent_message_id"), // remove self-reference for now
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced gamification system
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementType: varchar("achievement_type").notNull(), // voting, discussion, petition, legal_research
  achievementName: varchar("achievement_name").notNull(),
  description: text("description"),
  badgeIcon: varchar("badge_icon"),
  badgeColor: varchar("badge_color"),
  pointsAwarded: integer("points_awarded").default(0),
  rarity: varchar("rarity").default("common"), // common, rare, epic, legendary
  relatedEntityId: integer("related_entity_id"), // bill_id, petition_id, etc.
  relatedEntityType: varchar("related_entity_type"), // bill, petition, discussion
  earnedAt: timestamp("earned_at").defaultNow(),
  isVisible: boolean("is_visible").default(true),
}, (table) => ({
  uniqueUserAchievement: unique().on(table.userId, table.achievementType, table.achievementName),
}));

export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type").notNull(), // vote, post, reply, petition_sign, legal_search
  entityId: integer("entity_id"), // id of the thing they interacted with
  entityType: varchar("entity_type"), // bill, post, reply, petition, legal_act
  pointsEarned: integer("points_earned").default(0),
  details: jsonb("details"), // additional activity context
  createdAt: timestamp("created_at").defaultNow(),
});

export const civicLevels = pgTable("civic_levels", {
  id: serial("id").primaryKey(),
  levelName: varchar("level_name").notNull(),
  minPoints: integer("min_points").notNull(),
  maxPoints: integer("max_points"),
  description: text("description"),
  benefits: text("benefits").array(),
  badgeIcon: varchar("badge_icon"),
  badgeColor: varchar("badge_color"),
  isActive: boolean("is_active").default(true),
});

// Legal research tracking
export const legalSearchHistory = pgTable("legal_search_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  searchQuery: varchar("search_query").notNull(),
  searchType: varchar("search_type").notNull(), // act, section, case, criminal_code
  resultsFound: integer("results_found").default(0),
  timeSpent: integer("time_spent"), // seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const politicianSectors = pgTable("politician_sectors", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // Health, Finance, Defence, etc.
  description: text("description"),
  parentSectorId: integer("parent_sector_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Politician positions and voting history
export const politicianPositions = pgTable("politician_positions", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id),
  billId: integer("bill_id").references(() => bills.id),
  position: varchar("position").notNull(), // support, oppose, neutral
  reasoning: text("reasoning"),
  publicStatement: text("public_statement"),
  dateStated: timestamp("date_stated").defaultNow(),
  source: varchar("source"), // hansard, press release, interview
  verified: boolean("verified").default(false),
});

// Campaign Finance tracking from Elections Canada
export const campaignFinance = pgTable("campaign_finance", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id),
  totalRaised: decimal("total_raised", { precision: 12, scale: 2 }).default("0.00"),
  individualDonations: decimal("individual_donations", { precision: 12, scale: 2 }).default("0.00"),
  corporateDonations: decimal("corporate_donations", { precision: 12, scale: 2 }).default("0.00"),
  publicFunding: decimal("public_funding", { precision: 12, scale: 2 }).default("0.00"),
  expenditures: decimal("expenditures", { precision: 12, scale: 2 }).default("0.00"),
  surplus: decimal("surplus", { precision: 12, scale: 2 }).default("0.00"),
  largestDonor: varchar("largest_donor"),
  suspiciousTransactions: integer("suspicious_transactions").default(0),
  complianceScore: integer("compliance_score").default(95),
  reportingPeriod: varchar("reporting_period").notNull(),
  filingDeadline: varchar("filing_deadline"),
  sourceUrl: varchar("source_url"),
  electionsCanadaId: varchar("elections_canada_id"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});



// Discussion board system
export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull().references(() => bills.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").default("general"), // general, analysis, question, debate
  isVerified: boolean("is_verified").default(false), // government ID verified user
  likesCount: integer("likes_count").default(0),
  repliesCount: integer("replies_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  isModerated: boolean("is_moderated").default(false),
  moderationReason: text("moderation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discussionReplies = pgTable("discussion_replies", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull().references(() => discussions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  parentReplyId: integer("parent_reply_id"), // for nested replies
  content: text("content").notNull(),
  isVerified: boolean("is_verified").default(false),
  likesCount: integer("likes_count").default(0),
  isModerated: boolean("is_moderated").default(false),
  moderationReason: text("moderation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discussionLikes = pgTable("discussion_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  discussionId: integer("discussion_id").references(() => discussions.id),
  replyId: integer("reply_id").references(() => discussionReplies.id),
  likeType: varchar("like_type").default("like"), // like, dislike, support, oppose
  createdAt: timestamp("created_at").defaultNow(),
});

// Legal transparency tables
export const lawUpdates = pgTable("law_updates", {
  id: serial("id").primaryKey(),
  lawType: varchar("law_type").notNull(), // criminal_code, civil_code, statute, regulation
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  changeType: varchar("change_type").notNull(), // new, amended, repealed
  effectiveDate: timestamp("effective_date").notNull(),
  jurisdiction: varchar("jurisdiction").notNull(), // federal, provincial, municipal
  province: varchar("province"),
  legalReference: varchar("legal_reference").notNull(),
  fullText: text("full_text"),
  summary: text("summary"),
  impactAnalysis: text("impact_analysis"),
  publicConsultationDeadline: timestamp("public_consultation_deadline"),
  sourceUrl: varchar("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const governmentServices = pgTable("government_services", {
  id: serial("id").primaryKey(),
  serviceName: varchar("service_name").notNull(),
  department: varchar("department").notNull(),
  description: text("description").notNull(),
  serviceType: varchar("service_type").notNull(), // application, information, complaint, emergency
  jurisdiction: varchar("jurisdiction").notNull(), // federal, provincial, municipal
  province: varchar("province"),
  city: varchar("city"),
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  websiteUrl: varchar("website_url"),
  physicalAddress: text("physical_address"),
  hoursOfOperation: text("hours_of_operation"),
  onlineAccessible: boolean("online_accessible").default(false),
  applicationRequired: boolean("application_required").default(false),
  fees: text("fees"),
  processingTime: varchar("processing_time"),
  requiredDocuments: text("required_documents").array(),
  keywords: text("keywords").array(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});



// Election and candidate tracking
export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  electionName: varchar("election_name").notNull(),
  electionType: varchar("election_type").notNull(), // federal, provincial, municipal, by-election
  jurisdiction: varchar("jurisdiction").notNull(),
  province: varchar("province"),
  municipality: varchar("municipality"),
  electionDate: timestamp("election_date").notNull(),
  registrationDeadline: timestamp("registration_deadline"),
  advanceVotingStart: timestamp("advance_voting_start"),
  advanceVotingEnd: timestamp("advance_voting_end"),
  isCompleted: boolean("is_completed").default(false),
  totalVoters: integer("total_voters"),
  voterTurnout: decimal("voter_turnout", { precision: 5, scale: 2 }),
  status: varchar("status").default("upcoming"), // upcoming, active, completed, cancelled
  officialResultsUrl: varchar("official_results_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id),
  name: varchar("name").notNull(),
  party: varchar("party"),
  constituency: varchar("constituency").notNull(),
  biography: text("biography"),
  website: varchar("website"),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  campaignWebsite: varchar("campaign_website"),
  socialMediaTwitter: varchar("social_media_twitter"),
  socialMediaFacebook: varchar("social_media_facebook"),
  socialMediaInstagram: varchar("social_media_instagram"),
  occupation: varchar("occupation"),
  education: text("education"),
  previousExperience: text("previous_experience"),
  keyPlatformPoints: text("key_platform_points").array(),
  campaignPromises: text("campaign_promises").array(),
  votesReceived: integer("votes_received"),
  votePercentage: decimal("vote_percentage", { precision: 5, scale: 2 }),
  isIncumbent: boolean("is_incumbent").default(false),
  isElected: boolean("is_elected").default(false),
  endorsements: text("endorsements").array(),
  financialDisclosure: text("financial_disclosure"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const candidatePolicies = pgTable("candidate_policies", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  policyArea: varchar("policy_area").notNull(), // healthcare, economy, environment, etc
  policyTitle: varchar("policy_title").notNull(),
  policyDescription: text("policy_description").notNull(),
  implementationPlan: text("implementation_plan"),
  estimatedCost: varchar("estimated_cost"),
  timeline: varchar("timeline"),
  priority: varchar("priority").default("medium"), // high, medium, low
  sourceDocument: varchar("source_document"),
  lastVerified: timestamp("last_verified").defaultNow(),
});

export const electoralDistricts = pgTable("electoral_districts", {
  id: serial("id").primaryKey(),
  districtName: varchar("district_name").notNull(),
  districtNumber: varchar("district_number"),
  province: varchar("province").notNull(),
  population: integer("population"),
  area: decimal("area", { precision: 10, scale: 2 }), // square kilometers
  demographics: jsonb("demographics"), // age groups, income levels, etc
  economicProfile: text("economic_profile"),
  keyIssues: text("key_issues").array(),
  historicalVoting: jsonb("historical_voting"), // past election results
  boundaries: text("boundaries"), // geographic description
  majorCities: text("major_cities").array(),
  currentRepresentative: varchar("current_representative"),
  lastElectionTurnout: decimal("last_election_turnout", { precision: 5, scale: 2 }),
  isUrban: boolean("is_urban").default(false),
  isRural: boolean("is_rural").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollingSites = pgTable("polling_sites", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id),
  districtId: integer("district_id").references(() => electoralDistricts.id),
  siteName: varchar("site_name").notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  postalCode: varchar("postal_code").notNull(),
  accessibility: text("accessibility"), // wheelchair accessible, parking, etc
  hoursOpen: varchar("hours_open"),
  isAdvancePolling: boolean("is_advance_polling").default(false),
  specialInstructions: text("special_instructions"),
  coordinates: varchar("coordinates"), // lat,lng for mapping
});

// News analysis and propaganda detection
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  url: varchar("url").notNull().unique(),
  source: varchar("source").notNull(), // CBC, Globe and Mail, etc
  author: varchar("author"),
  publishedAt: timestamp("published_at").notNull(),
  scrapedAt: timestamp("scraped_at").defaultNow(),
  category: varchar("category"), // politics, economy, health, etc
  
  // Enhanced analysis scores
  truthScore: decimal("truth_score", { precision: 5, scale: 2 }), // 0-100
  biasScore: decimal("bias_score", { precision: 5, scale: 2 }), // -100 to 100 (left to right)
  propagandaRisk: varchar("propaganda_risk"), // low, medium, high
  credibilityScore: decimal("credibility_score", { precision: 5, scale: 2 }), // 0-100
  bias: varchar("bias").default("center"), // left, center, right
  factualityScore: integer("factuality_score").default(50), // 0-100
  emotionalTone: varchar("emotional_tone").default("neutral"), // neutral, positive, negative, angry, fearful, hopeful
  
  // Enhanced content analysis
  sentiment: varchar("sentiment"), // positive, negative, neutral
  sentimentScore: integer("sentiment_score").default(0), // -100 to 100
  emotionalLanguage: boolean("emotional_language").default(false),
  factualClaims: text("factual_claims").array(), // extracted claims
  verifiedFacts: text("verified_facts").array(), // fact-checked claims
  falseStatements: text("false_statements").array(), // debunked claims
  propagandaTechniques: text("propaganda_techniques").array(), // propaganda techniques identified
  keyTopics: text("key_topics").array(), // main topics covered
  claims: jsonb("claims"), // structured claims analysis
  
  // Political connections
  mentionedPoliticians: text("mentioned_politicians").array(),
  politiciansInvolved: text("politicians_involved").array(),
  mentionedParties: text("mentioned_parties").array(),
  relatedBills: text("related_bills").array(),
  
  // Meta analysis
  analysisNotes: text("analysis_notes"),
  analysisDate: timestamp("analysis_date").defaultNow(),
  lastAnalyzed: timestamp("last_analyzed").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  publicImpact: integer("public_impact").default(50), // 0-100
});

export const newsSourceCredibility = pgTable("news_source_credibility", {
  id: serial("id").primaryKey(),
  sourceName: varchar("source_name").notNull().unique(),
  overallCredibility: decimal("overall_credibility", { precision: 5, scale: 2 }).notNull(), // 0-100
  factualReporting: decimal("factual_reporting", { precision: 5, scale: 2 }).notNull(), // 0-100
  biasRating: decimal("bias_rating", { precision: 5, scale: 2 }).notNull(), // -100 to 100
  propagandaFrequency: decimal("propaganda_frequency", { precision: 5, scale: 2 }).notNull(), // 0-100
  
  // Historical performance
  totalArticles: integer("total_articles").default(0),
  accurateReports: integer("accurate_reports").default(0),
  misleadingReports: integer("misleading_reports").default(0),
  falseReports: integer("false_reports").default(0),
  
  // Analysis details
  commonBiases: text("common_biases").array(),
  propagandaTechniques: text("propaganda_techniques").array(),
  reliabilityNotes: text("reliability_notes"),
  
  lastEvaluated: timestamp("last_evaluated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// News comparisons and cross-source analysis
export const newsComparisons = pgTable("news_comparisons", {
  id: serial("id").primaryKey(),
  topic: varchar("topic").notNull().unique(),
  sources: text("sources").array().notNull(), // array of news source names
  consensusLevel: integer("consensus_level").notNull(), // 0-100 agreement level
  majorDiscrepancies: text("major_discrepancies").array(),
  propagandaPatterns: text("propaganda_patterns").array(),
  factualAccuracy: integer("factual_accuracy").notNull(), // 0-100
  politicalBias: jsonb("political_bias").notNull(), // {left: 30, center: 40, right: 30}
  mediaManipulation: text("media_manipulation"),
  publicImpact: text("public_impact"),
  recommendedAction: text("recommended_action"),
  analysisDate: timestamp("analysis_date").defaultNow(),
  articleCount: integer("article_count").default(0),
});

export const politicianTruthTracking = pgTable("politician_truth_tracking", {
  id: serial("id").primaryKey(),
  politicianId: integer("politician_id").notNull().references(() => politicians.id),
  
  // Truth scores
  overallTruthScore: decimal("overall_truth_score", { precision: 5, scale: 2 }).default("100.00"), // 0-100
  promiseKeepingScore: decimal("promise_keeping_score", { precision: 5, scale: 2 }).default("100.00"),
  factualAccuracyScore: decimal("factual_accuracy_score", { precision: 5, scale: 2 }).default("100.00"),
  consistencyScore: decimal("consistency_score", { precision: 5, scale: 2 }).default("100.00"),
  
  // Statement tracking
  totalStatements: integer("total_statements").default(0),
  truthfulStatements: integer("truthful_statements").default(0),
  misleadingStatements: integer("misleading_statements").default(0),
  falseStatements: integer("false_statements").default(0),
  contradictoryStatements: integer("contradictory_statements").default(0),
  
  // Promise tracking
  totalPromises: integer("total_promises").default(0),
  keptPromises: integer("kept_promises").default(0),
  brokenPromises: integer("broken_promises").default(0),
  pendingPromises: integer("pending_promises").default(0),
  
  // Analysis details
  commonMisleadingTopics: text("common_misleading_topics").array(),
  frequentContradictions: text("frequent_contradictions").array(),
  reliabilityTrend: varchar("reliability_trend"), // improving, declining, stable
  
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const factChecks = pgTable("fact_checks", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => newsArticles.id),
  politicianId: integer("politician_id").references(() => politicians.id),
  billId: integer("bill_id").references(() => bills.id),
  
  originalClaim: text("original_claim").notNull(),
  verificationResult: varchar("verification_result").notNull(), // true, false, misleading, unverifiable
  evidenceSources: text("evidence_sources").array(),
  factCheckSummary: text("fact_check_summary").notNull(),
  
  // Scoring
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }).notNull(), // 0-100
  severityScore: decimal("severity_score", { precision: 5, scale: 2 }), // impact of misinformation
  
  checkedBy: varchar("checked_by").notNull(), // AI system or human reviewer
  checkedAt: timestamp("checked_at").defaultNow(),
});

export const propagandaDetection = pgTable("propaganda_detection", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => newsArticles.id),
  
  // Propaganda techniques detected
  techniques: text("techniques").array(), // bandwagon, fear mongering, ad hominem, etc
  riskLevel: varchar("risk_level").notNull(), // low, medium, high, extreme
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).notNull(),
  
  // Analysis details
  emotionalTriggers: text("emotional_triggers").array(),
  manipulativePhrases: text("manipulative_phrases").array(),
  logicalFallacies: text("logical_fallacies").array(),
  missingContext: text("missing_context").array(),
  
  analysisDetails: text("analysis_details").notNull(),
  detectedAt: timestamp("detected_at").defaultNow(),
});

// Identity verification tables (temporarily commented for cleanup)
// Will be re-enabled after application is stable
/*
export const identityVerifications = pgTable("identity_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const userVerificationStatus = pgTable("user_verification_status", {
  userId: varchar("user_id").primaryKey(),
  isVerified: boolean("is_verified").default(false),
  verificationLevel: varchar("verification_level").default("none"),
});
*/

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  votes: many(votes),
  notifications: many(notifications),
  petitions: many(petitions, { relationName: "creator" }),
  petitionSignatures: many(petitionSignatures),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));



export const petitionsRelations = relations(petitions, ({ one, many }) => ({
  creator: one(users, {
    fields: [petitions.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  relatedBill: one(bills, {
    fields: [petitions.relatedBillId],
    references: [bills.id],
  }),
  signatures: many(petitionSignatures),
  notifications: many(notifications),
}));

export const petitionSignaturesRelations = relations(petitionSignatures, ({ one }) => ({
  petition: one(petitions, {
    fields: [petitionSignatures.petitionId],
    references: [petitions.id],
  }),
  user: one(users, {
    fields: [petitionSignatures.userId],
    references: [users.id],
  }),
}));

export const politicianPartiesRelations = relations(politicianParties, ({ many }) => ({
  politicians: many(politicians),
}));

export const politicianSectorsRelations = relations(politicianSectors, ({ one, many }) => ({
  parentSector: one(politicianSectors, {
    fields: [politicianSectors.parentSectorId],
    references: [politicianSectors.id],
    relationName: "parent",
  }),
  childSectors: many(politicianSectors, { relationName: "parent" }),
  politicians: many(politicians),
}));

export const politicianPositionsRelations = relations(politicianPositions, ({ one }) => ({
  politician: one(politicians, {
    fields: [politicianPositions.politicianId],
    references: [politicians.id],
  }),
  bill: one(bills, {
    fields: [politicianPositions.billId],
    references: [bills.id],
  }),
}));



export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const politiciansRelations = relations(politicians, ({ many }) => ({
  statements: many(politicianStatements),
}));

export const politicianStatementsRelations = relations(politicianStatements, ({ one }) => ({
  politician: one(politicians, {
    fields: [politicianStatements.politicianId],
    references: [politicians.id],
  }),
}));



// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  electoralDistrict: true,
  phoneNumber: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  userId: true,
  timestamp: true,
  isVerified: true,
  verificationId: true,
  blockHash: true,
});

export const insertPoliticianSchema = createInsertSchema(politicians).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect & {
  claims?: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
};
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Politician = typeof politicians.$inferSelect;
export type InsertPolitician = z.infer<typeof insertPoliticianSchema>;
export type PoliticianStatement = typeof politicianStatements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = typeof userNotificationPreferences.$inferInsert;
export type Petition = typeof petitions.$inferSelect;
export type InsertPetition = typeof petitions.$inferInsert;
export type PetitionSignature = typeof petitionSignatures.$inferSelect;
export type InsertPetitionSignature = typeof petitionSignatures.$inferInsert;

// Type definitions for new tables
export type LegalAct = typeof legalActs.$inferSelect;
export type InsertLegalAct = typeof legalActs.$inferInsert;
export type LegalSection = typeof legalSections.$inferSelect;
export type InsertLegalSection = typeof legalSections.$inferInsert;
export type LegalCase = typeof legalCases.$inferSelect;
export type InsertLegalCase = typeof legalCases.$inferInsert;
export type CriminalCodeSection = typeof criminalCodeSections.$inferSelect;
export type InsertCriminalCodeSection = typeof criminalCodeSections.$inferInsert;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = typeof forumCategories.$inferInsert;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;
export type ForumLike = typeof forumLikes.$inferSelect;
export type InsertForumLike = typeof forumLikes.$inferInsert;
export type UserMessage = typeof userMessages.$inferSelect;
export type InsertUserMessage = typeof userMessages.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;
export type CivicLevel = typeof civicLevels.$inferSelect;
export type InsertCivicLevel = typeof civicLevels.$inferInsert;
export type LegalSearchHistory = typeof legalSearchHistory.$inferSelect;
export type InsertLegalSearchHistory = typeof legalSearchHistory.$inferInsert;

// Charter of Rights and Freedoms system
export const charterRights = pgTable("charter_rights", {
  id: serial("id").primaryKey(),
  section: integer("section").notNull().unique(),
  title: varchar("title").notNull(),
  category: varchar("category").notNull(), // fundamental, democratic, mobility, legal, equality, language
  text: text("text").notNull(),
  plainLanguage: text("plain_language").notNull(),
  examples: text("examples").array(),
  limitations: text("limitations").array(),
  relatedSections: integer("related_sections").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const provincialRights = pgTable("provincial_rights", {
  id: serial("id").primaryKey(),
  province: varchar("province").notNull(),
  title: varchar("title").notNull(),
  category: varchar("category").notNull(),
  description: text("description").notNull(),
  plainLanguage: text("plain_language").notNull(),
  examples: text("examples").array(),
  relatedCharter: integer("related_charter").array(),
  sourceAct: varchar("source_act"),
  sourceSection: varchar("source_section"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const provincialVariations = pgTable("provincial_variations", {
  id: serial("id").primaryKey(),
  charterRightId: integer("charter_right_id").notNull().references(() => charterRights.id),
  province: varchar("province").notNull(),
  variation: text("variation").notNull(),
  examples: text("examples").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CharterRight = typeof charterRights.$inferSelect;
export type InsertCharterRight = typeof charterRights.$inferInsert;
export type ProvincialRight = typeof provincialRights.$inferSelect;
export type InsertProvincialRight = typeof provincialRights.$inferInsert;
