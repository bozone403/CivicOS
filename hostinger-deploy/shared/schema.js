import { pgTable, text, varchar, timestamp, jsonb, index, serial, integer, boolean, decimal, date, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// Session storage table
export const sessions = pgTable("sessions", {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);
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
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    accountStatus: varchar("account_status").default("active"),
    suspendedUntil: timestamp("suspended_until"),
    suspensionReason: text("suspension_reason"),
});
// Politicians table
export const politicians = pgTable("politicians", {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    party: varchar("party"),
    position: varchar("position"),
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
});
// Social posts table
export const socialPosts = pgTable("social_posts", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    type: varchar("type").default("post"),
    isPublic: boolean("is_public").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    reaction: varchar("reaction").default("like"),
    sourceId: varchar("source_id"),
    dateCreated: timestamp("date_created").defaultNow(),
    isFeatured: boolean("is_featured").default(false),
    featuredAt: timestamp("featured_at"),
    moderationStatus: varchar("moderation_status").default("approved"),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: varchar("moderated_by"),
    moderationNotes: text("moderation_notes"),
});
// Social comments table
export const socialComments = pgTable("social_comments", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    parentId: integer("parent_id"),
    isEdited: boolean("is_edited").default(false),
    editedAt: timestamp("edited_at"),
    moderationStatus: varchar("moderation_status").default("approved"),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: varchar("moderated_by"),
});
// Social likes table
export const socialLikes = pgTable("social_likes", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
    reaction: varchar("reaction").default("like"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Social Shares table
export const socialShares = pgTable("social_shares", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: varchar("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
    platform: varchar("platform").notNull(),
    sharedAt: timestamp("shared_at").defaultNow(),
});
// Social Bookmarks table
export const socialBookmarks = pgTable("social_bookmarks", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: varchar("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
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
});
// News articles table
export const newsArticles = pgTable("news_articles", {
    id: serial("id").primaryKey(),
    title: varchar("title").notNull(),
    content: text("content"),
    url: varchar("url").unique(),
    source: varchar("source"),
    author: varchar("author"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
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
});
// Criminal code sections table
export const criminalCodeSections = pgTable("criminal_code_sections", {
    id: serial("id").primaryKey(),
    sectionNumber: varchar("section_number").notNull(),
    title: varchar("title").notNull(),
    content: text("content"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
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
});
// Legal cases table
export const legalCases = pgTable("legal_cases", {
    id: serial("id").primaryKey(),
    caseNumber: varchar("case_number").notNull(),
    title: varchar("title").notNull(),
    description: text("description"),
    jurisdiction: varchar("jurisdiction"),
    status: varchar("status"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
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
    politicianId: varchar("politician_id").notNull(),
    statement: text("statement").notNull(),
    context: text("context"),
    date: timestamp("date").notNull(),
    source: varchar("source"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Politician positions table
export const politicianPositions = pgTable("politician_positions", {
    id: serial("id").primaryKey(),
    politicianId: varchar("politician_id").notNull(),
    position: varchar("position").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Campaign finance table
export const campaignFinance = pgTable("campaign_finance", {
    id: serial("id").primaryKey(),
    politicianId: varchar("politician_id").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    source: varchar("source"),
    date: timestamp("date"),
    type: varchar("type"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Politician truth tracking table
export const politicianTruthTracking = pgTable("politician_truth_tracking", {
    id: serial("id").primaryKey(),
    politicianId: varchar("politician_id").notNull(),
    statementId: integer("statement_id"),
    truthScore: decimal("truth_score", { precision: 3, scale: 2 }),
    factCheckResult: varchar("fact_check_result"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Petitions table
export const petitions = pgTable("petitions", {
    id: serial("id").primaryKey(),
    title: varchar("title").notNull(),
    description: text("description"),
    creatorId: varchar("creator_id").notNull(),
    targetSignatures: integer("target_signatures"),
    currentSignatures: integer("current_signatures").default(0),
    status: varchar("status").default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Petition signatures table
export const petitionSignatures = pgTable("petition_signatures", {
    id: serial("id").primaryKey(),
    petitionId: integer("petition_id").notNull(),
    userId: varchar("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
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
    permissionId: integer("permission_id").notNull(),
    grantedAt: timestamp("granted_at").defaultNow(),
    grantedBy: varchar("granted_by"),
});
// Permissions table
export const permissions = pgTable("permissions", {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    description: text("description"),
    category: varchar("category"),
    createdAt: timestamp("created_at").defaultNow(),
});
// Membership permissions table
export const membershipPermissions = pgTable("membership_permissions", {
    id: serial("id").primaryKey(),
    membershipType: varchar("membership_type").notNull(),
    permissionId: integer("permission_id").notNull(),
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
});
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
