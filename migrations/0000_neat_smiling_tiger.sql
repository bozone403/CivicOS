CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar,
	"category" varchar,
	"rarity" varchar DEFAULT 'common',
	"points_required" integer DEFAULT 0,
	"criteria" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_number" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"full_text" text,
	"ai_summary" text,
	"category" varchar,
	"jurisdiction" varchar NOT NULL,
	"status" varchar DEFAULT 'Active',
	"voting_deadline" timestamp,
	"date_introduced" timestamp,
	"sponsor" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bills_bill_number_unique" UNIQUE("bill_number")
);
--> statement-breakpoint
CREATE TABLE "campaign_finance" (
	"id" serial PRIMARY KEY NOT NULL,
	"politician_id" integer NOT NULL,
	"total_raised" numeric(12, 2) DEFAULT '0.00',
	"individual_donations" numeric(12, 2) DEFAULT '0.00',
	"corporate_donations" numeric(12, 2) DEFAULT '0.00',
	"public_funding" numeric(12, 2) DEFAULT '0.00',
	"expenditures" numeric(12, 2) DEFAULT '0.00',
	"surplus" numeric(12, 2) DEFAULT '0.00',
	"largest_donor" varchar,
	"suspicious_transactions" integer DEFAULT 0,
	"compliance_score" integer DEFAULT 95,
	"reporting_period" varchar NOT NULL,
	"filing_deadline" varchar,
	"source_url" varchar,
	"elections_canada_id" varchar,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidate_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"policy_area" varchar NOT NULL,
	"policy_title" varchar NOT NULL,
	"policy_description" text NOT NULL,
	"implementation_plan" text,
	"estimated_cost" varchar,
	"timeline" varchar,
	"priority" varchar DEFAULT 'medium',
	"source_document" varchar,
	"last_verified" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"party" varchar,
	"constituency" varchar NOT NULL,
	"biography" text,
	"website" varchar,
	"email" varchar,
	"phone_number" varchar,
	"campaign_website" varchar,
	"social_media_twitter" varchar,
	"social_media_facebook" varchar,
	"social_media_instagram" varchar,
	"occupation" varchar,
	"education" text,
	"previous_experience" text,
	"key_platform_points" text[],
	"campaign_promises" text[],
	"votes_received" integer,
	"vote_percentage" numeric(5, 2),
	"is_incumbent" boolean DEFAULT false,
	"is_elected" boolean DEFAULT false,
	"endorsements" text[],
	"financial_disclosure" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "charter_rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" integer NOT NULL,
	"title" varchar NOT NULL,
	"category" varchar NOT NULL,
	"text" text NOT NULL,
	"plain_language" text NOT NULL,
	"examples" text[],
	"limitations" text[],
	"related_sections" integer[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "charter_rights_section_unique" UNIQUE("section")
);
--> statement-breakpoint
CREATE TABLE "civic_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"activity_type" varchar NOT NULL,
	"points" integer DEFAULT 0,
	"description" text,
	"related_id" integer,
	"related_type" varchar,
	"metadata" jsonb,
	"verification_level" varchar DEFAULT 'automatic',
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "civic_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"level_name" varchar NOT NULL,
	"min_points" integer NOT NULL,
	"max_points" integer,
	"description" text,
	"benefits" text[],
	"badge_icon" varchar,
	"badge_color" varchar,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "criminal_code_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_number" varchar NOT NULL,
	"title" varchar NOT NULL,
	"offense" varchar,
	"content" text NOT NULL,
	"max_penalty" varchar,
	"min_penalty" varchar,
	"is_summary" boolean DEFAULT false,
	"is_indictable" boolean DEFAULT false,
	"is_hybrid" boolean DEFAULT false,
	"explanation_simple" text,
	"common_examples" text[],
	"defenses" text[],
	"related_sections" varchar[],
	"amendments" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "criminal_code_sections_section_number_unique" UNIQUE("section_number")
);
--> statement-breakpoint
CREATE TABLE "daily_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"points_reward" integer DEFAULT 50,
	"difficulty" varchar DEFAULT 'easy',
	"criteria" jsonb,
	"valid_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"participant_count" integer DEFAULT 0,
	"completion_rate" numeric(5, 2) DEFAULT '0.00'
);
--> statement-breakpoint
CREATE TABLE "discussion_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"discussion_id" integer,
	"reply_id" integer,
	"like_type" varchar DEFAULT 'like',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discussion_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"discussion_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"parent_reply_id" integer,
	"content" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"likes_count" integer DEFAULT 0,
	"is_moderated" boolean DEFAULT false,
	"moderation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discussions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"type" varchar DEFAULT 'general',
	"is_verified" boolean DEFAULT false,
	"likes_count" integer DEFAULT 0,
	"replies_count" integer DEFAULT 0,
	"is_pinned" boolean DEFAULT false,
	"is_moderated" boolean DEFAULT false,
	"moderation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "elections" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_name" varchar NOT NULL,
	"election_type" varchar NOT NULL,
	"jurisdiction" varchar NOT NULL,
	"province" varchar,
	"municipality" varchar,
	"election_date" timestamp NOT NULL,
	"registration_deadline" timestamp,
	"advance_voting_start" timestamp,
	"advance_voting_end" timestamp,
	"is_completed" boolean DEFAULT false,
	"total_voters" integer,
	"voter_turnout" numeric(5, 2),
	"status" varchar DEFAULT 'upcoming',
	"official_results_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "electoral_districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_name" varchar NOT NULL,
	"district_number" varchar,
	"province" varchar NOT NULL,
	"population" integer,
	"area" numeric(10, 2),
	"demographics" jsonb,
	"economic_profile" text,
	"key_issues" text[],
	"historical_voting" jsonb,
	"boundaries" text,
	"major_cities" text[],
	"current_representative" varchar,
	"last_election_turnout" numeric(5, 2),
	"is_urban" boolean DEFAULT false,
	"is_rural" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fact_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"politician_id" integer,
	"bill_id" integer,
	"original_claim" text NOT NULL,
	"verification_result" varchar NOT NULL,
	"evidence_sources" text[],
	"fact_check_summary" text NOT NULL,
	"confidence_level" numeric(5, 2) NOT NULL,
	"severity_score" numeric(5, 2),
	"checked_by" varchar NOT NULL,
	"checked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"color" varchar,
	"icon" varchar,
	"parent_category_id" integer,
	"is_visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"post_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"post_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "forum_likes_user_id_post_id_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"category_id" integer NOT NULL,
	"subcategory_id" integer,
	"bill_id" integer,
	"is_sticky" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"topic" varchar,
	"moderation_status" varchar,
	"moderation_reason" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"parent_reply_id" integer,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"like_count" integer DEFAULT 0,
	"moderation_status" varchar DEFAULT 'approved',
	"moderation_reason" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_reply_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reply_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "forum_reply_likes_user_id_reply_id_unique" UNIQUE("user_id","reply_id")
);
--> statement-breakpoint
CREATE TABLE "forum_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"color" varchar,
	"icon" varchar,
	"is_visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"post_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "government_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_name" varchar NOT NULL,
	"department" varchar NOT NULL,
	"description" text NOT NULL,
	"service_type" varchar NOT NULL,
	"jurisdiction" varchar NOT NULL,
	"province" varchar,
	"city" varchar,
	"phone_number" varchar,
	"email" varchar,
	"website_url" varchar,
	"physical_address" text,
	"hours_of_operation" text,
	"online_accessible" boolean DEFAULT false,
	"application_required" boolean DEFAULT false,
	"fees" text,
	"processing_time" varchar,
	"required_documents" text[],
	"keywords" text[],
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "law_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"law_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"change_type" varchar NOT NULL,
	"effective_date" timestamp NOT NULL,
	"jurisdiction" varchar NOT NULL,
	"province" varchar,
	"legal_reference" varchar NOT NULL,
	"full_text" text,
	"summary" text,
	"impact_analysis" text,
	"public_consultation_deadline" timestamp,
	"source_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leaderboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"category" varchar NOT NULL,
	"rank" integer,
	"score" integer,
	"period" varchar,
	"period_start" timestamp,
	"period_end" timestamp,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_acts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"short_title" varchar,
	"act_number" varchar NOT NULL,
	"jurisdiction" varchar NOT NULL,
	"province" varchar,
	"category" varchar NOT NULL,
	"status" varchar DEFAULT 'active',
	"date_enacted" timestamp,
	"last_amended" timestamp,
	"full_text" text,
	"summary" text,
	"key_provisions" text[],
	"related_acts" varchar[],
	"source_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "legal_acts_act_number_unique" UNIQUE("act_number")
);
--> statement-breakpoint
CREATE TABLE "legal_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_name" varchar NOT NULL,
	"case_number" varchar,
	"court" varchar NOT NULL,
	"jurisdiction" varchar NOT NULL,
	"date_decided" timestamp,
	"judge" varchar,
	"parties" jsonb,
	"summary" text,
	"ruling" text,
	"precedent_set" text,
	"related_act_ids" integer[],
	"related_section_ids" integer[],
	"key_quotes" text[],
	"significance" varchar,
	"source_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_search_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"search_query" varchar NOT NULL,
	"search_type" varchar NOT NULL,
	"results_found" integer DEFAULT 0,
	"time_spent" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"act_id" integer NOT NULL,
	"section_number" varchar NOT NULL,
	"title" varchar,
	"content" text NOT NULL,
	"subsections" jsonb,
	"penalties" text,
	"explanation_simple" text,
	"real_world_examples" text[],
	"related_sections" varchar[],
	"precedent_cases" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"url" varchar NOT NULL,
	"source" varchar NOT NULL,
	"author" varchar,
	"published_at" timestamp NOT NULL,
	"scraped_at" timestamp DEFAULT now(),
	"category" varchar,
	"truth_score" numeric(5, 2),
	"bias_score" numeric(5, 2),
	"propaganda_risk" varchar,
	"credibility_score" numeric(5, 2),
	"bias" varchar DEFAULT 'center',
	"factuality_score" integer DEFAULT 50,
	"emotional_tone" varchar DEFAULT 'neutral',
	"sentiment" varchar,
	"sentiment_score" integer DEFAULT 0,
	"emotional_language" boolean DEFAULT false,
	"factual_claims" text[],
	"verified_facts" text[],
	"false_statements" text[],
	"propaganda_techniques" text[],
	"key_topics" text[],
	"claims" jsonb,
	"mentioned_politicians" text[],
	"politicians_involved" text[],
	"mentioned_parties" text[],
	"related_bills" text[],
	"analysis_notes" text,
	"analysis_date" timestamp DEFAULT now(),
	"last_analyzed" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT false,
	"public_impact" integer DEFAULT 50,
	CONSTRAINT "news_articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "news_comparisons" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" varchar NOT NULL,
	"sources" text[] NOT NULL,
	"consensus_level" integer NOT NULL,
	"major_discrepancies" text[],
	"propaganda_patterns" text[],
	"factual_accuracy" integer NOT NULL,
	"political_bias" jsonb NOT NULL,
	"media_manipulation" text,
	"public_impact" text,
	"recommended_action" text,
	"analysis_date" timestamp DEFAULT now(),
	"article_count" integer DEFAULT 0,
	CONSTRAINT "news_comparisons_topic_unique" UNIQUE("topic")
);
--> statement-breakpoint
CREATE TABLE "news_source_credibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_name" varchar NOT NULL,
	"overall_credibility" numeric(5, 2) NOT NULL,
	"factual_reporting" numeric(5, 2) NOT NULL,
	"bias_rating" numeric(5, 2) NOT NULL,
	"propaganda_frequency" numeric(5, 2) NOT NULL,
	"total_articles" integer DEFAULT 0,
	"accurate_reports" integer DEFAULT 0,
	"misleading_reports" integer DEFAULT 0,
	"false_reports" integer DEFAULT 0,
	"common_biases" text[],
	"propaganda_techniques" text[],
	"reliability_notes" text,
	"last_evaluated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "news_source_credibility_source_name_unique" UNIQUE("source_name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"source_module" varchar NOT NULL,
	"source_id" varchar,
	"is_read" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"priority" varchar DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "petition_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"petition_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"signed_at" timestamp DEFAULT now(),
	"verification_id" varchar NOT NULL,
	CONSTRAINT "petition_signatures_petition_id_user_id_unique" UNIQUE("petition_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "petitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"related_bill_id" integer,
	"creator_id" varchar NOT NULL,
	"target_signatures" integer DEFAULT 500,
	"current_signatures" integer DEFAULT 0,
	"status" varchar DEFAULT 'active',
	"auto_created" boolean DEFAULT false,
	"vote_threshold_met" timestamp,
	"deadline_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "politician_controversies" (
	"id" serial PRIMARY KEY NOT NULL,
	"politician_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"severity" varchar DEFAULT 'medium',
	"date_occurred" timestamp,
	"source_url" varchar,
	"verified" boolean DEFAULT false,
	"impact_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "politician_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"abbreviation" varchar,
	"ideology" varchar,
	"color" varchar,
	"description" text,
	"website" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "politician_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"politician_id" integer NOT NULL,
	"bill_id" integer,
	"position" varchar NOT NULL,
	"reasoning" text,
	"public_statement" text,
	"date_stated" timestamp DEFAULT now(),
	"source" varchar,
	"verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "politician_sectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"parent_sector_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "politician_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"politician_id" integer NOT NULL,
	"statement" text NOT NULL,
	"context" varchar,
	"source" varchar,
	"date_created" timestamp DEFAULT now(),
	"is_contradiction" boolean DEFAULT false,
	"contradiction_details" text
);
--> statement-breakpoint
CREATE TABLE "politician_truth_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"politician_id" integer NOT NULL,
	"overall_truth_score" numeric(5, 2) DEFAULT '100.00',
	"promise_keeping_score" numeric(5, 2) DEFAULT '100.00',
	"factual_accuracy_score" numeric(5, 2) DEFAULT '100.00',
	"consistency_score" numeric(5, 2) DEFAULT '100.00',
	"total_statements" integer DEFAULT 0,
	"truthful_statements" integer DEFAULT 0,
	"misleading_statements" integer DEFAULT 0,
	"false_statements" integer DEFAULT 0,
	"contradictory_statements" integer DEFAULT 0,
	"total_promises" integer DEFAULT 0,
	"kept_promises" integer DEFAULT 0,
	"broken_promises" integer DEFAULT 0,
	"pending_promises" integer DEFAULT 0,
	"common_misleading_topics" text[],
	"frequent_contradictions" text[],
	"reliability_trend" varchar,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "politicians" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"position" varchar NOT NULL,
	"party" varchar,
	"jurisdiction" varchar NOT NULL,
	"constituency" varchar,
	"level" varchar,
	"contact" jsonb,
	"email" varchar,
	"phone" varchar,
	"office_address" varchar,
	"website" varchar,
	"trust_score" numeric(5, 2) DEFAULT '50.00',
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "polling_sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"district_id" integer,
	"site_name" varchar NOT NULL,
	"address" text NOT NULL,
	"city" varchar NOT NULL,
	"postal_code" varchar NOT NULL,
	"accessibility" text,
	"hours_open" varchar,
	"is_advance_polling" boolean DEFAULT false,
	"special_instructions" text,
	"coordinates" varchar
);
--> statement-breakpoint
CREATE TABLE "propaganda_detection" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"techniques" text[],
	"risk_level" varchar NOT NULL,
	"confidence_score" numeric(5, 2) NOT NULL,
	"emotional_triggers" text[],
	"manipulative_phrases" text[],
	"logical_fallacies" text[],
	"missing_context" text[],
	"analysis_details" text NOT NULL,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provincial_rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"province" varchar NOT NULL,
	"title" varchar NOT NULL,
	"category" varchar NOT NULL,
	"description" text NOT NULL,
	"plain_language" text NOT NULL,
	"examples" text[],
	"related_charter" integer[],
	"source_act" varchar,
	"source_section" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provincial_variations" (
	"id" serial PRIMARY KEY NOT NULL,
	"charter_right_id" integer NOT NULL,
	"province" varchar NOT NULL,
	"variation" text NOT NULL,
	"examples" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_type" varchar NOT NULL,
	"achievement_name" varchar NOT NULL,
	"description" text,
	"badge_icon" varchar,
	"badge_color" varchar,
	"points_awarded" integer DEFAULT 0,
	"rarity" varchar DEFAULT 'common',
	"related_entity_id" integer,
	"related_entity_type" varchar,
	"earned_at" timestamp DEFAULT now(),
	"is_visible" boolean DEFAULT true,
	CONSTRAINT "user_achievements_user_id_achievement_type_achievement_name_unique" UNIQUE("user_id","achievement_type","achievement_name")
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" varchar NOT NULL,
	"entity_id" integer,
	"entity_type" varchar,
	"points_earned" integer DEFAULT 0,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"badge_id" integer,
	"earned_at" timestamp DEFAULT now(),
	"progress" integer DEFAULT 0,
	"is_completed" boolean DEFAULT true,
	"notification_sent" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"challenge_id" integer,
	"progress" integer DEFAULT 0,
	"max_progress" integer DEFAULT 1,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"points_earned" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"interaction_type" varchar NOT NULL,
	"target_type" varchar NOT NULL,
	"target_id" integer NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"subject" varchar,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"parent_message_id" integer,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"petition_alerts" boolean DEFAULT true,
	"bill_updates" boolean DEFAULT true,
	"foi_responses" boolean DEFAULT true,
	"system_news" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT true,
	"sms_notifications" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"target_type" varchar NOT NULL,
	"target_id" integer NOT NULL,
	"vote_type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_votes_user_id_target_type_target_id_unique" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"electoral_district" varchar,
	"phone_number" varchar,
	"date_of_birth" timestamp,
	"government_id_verified" boolean DEFAULT false,
	"government_id_type" varchar,
	"verification_level" varchar DEFAULT 'unverified',
	"communication_style" varchar DEFAULT 'auto',
	"is_verified" boolean DEFAULT false,
	"civic_level" varchar DEFAULT 'Registered',
	"trust_score" numeric(5, 2) DEFAULT '100.00',
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"city" varchar,
	"province" varchar,
	"postal_code" varchar,
	"country" varchar DEFAULT 'Canada',
	"federal_riding" varchar,
	"provincial_riding" varchar,
	"municipal_ward" varchar,
	"address_verified" boolean DEFAULT false,
	"location_accuracy" integer,
	"location_timestamp" timestamp,
	"ip_address" varchar,
	"device_fingerprint" varchar,
	"authentication_history" jsonb,
	"profile_completeness" integer DEFAULT 0,
	"identity_verification_score" numeric(5, 2) DEFAULT '0.00',
	"residency_verified" boolean DEFAULT false,
	"citizenship_status" varchar,
	"voter_registration_status" varchar,
	"civic_points" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"total_badges" integer DEFAULT 0,
	"streak_days" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"achievement_tier" varchar DEFAULT 'bronze',
	"political_awareness_score" numeric(5, 2) DEFAULT '0.00',
	"engagement_level" varchar DEFAULT 'newcomer',
	"monthly_goal" integer DEFAULT 100,
	"yearly_goal" integer DEFAULT 1200,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vote_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" varchar NOT NULL,
	"target_id" integer NOT NULL,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"total_score" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vote_counts_target_type_target_id_unique" UNIQUE("target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"item_id" integer NOT NULL,
	"item_type" varchar NOT NULL,
	"vote_value" integer NOT NULL,
	"reasoning" text,
	"verification_id" varchar NOT NULL,
	"block_hash" varchar NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT true,
	CONSTRAINT "votes_verification_id_unique" UNIQUE("verification_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_finance" ADD CONSTRAINT "campaign_finance_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_policies" ADD CONSTRAINT "candidate_policies_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "civic_activities" ADD CONSTRAINT "civic_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_likes" ADD CONSTRAINT "discussion_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_likes" ADD CONSTRAINT "discussion_likes_discussion_id_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_likes" ADD CONSTRAINT "discussion_likes_reply_id_discussion_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."discussion_replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_discussion_id_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_checks" ADD CONSTRAINT "fact_checks_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_checks" ADD CONSTRAINT "fact_checks_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_checks" ADD CONSTRAINT "fact_checks_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_likes" ADD CONSTRAINT "forum_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_likes" ADD CONSTRAINT "forum_likes_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_subcategory_id_forum_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."forum_subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reply_likes" ADD CONSTRAINT "forum_reply_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reply_likes" ADD CONSTRAINT "forum_reply_likes_reply_id_forum_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."forum_replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_subcategories" ADD CONSTRAINT "forum_subcategories_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_search_history" ADD CONSTRAINT "legal_search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_sections" ADD CONSTRAINT "legal_sections_act_id_legal_acts_id_fk" FOREIGN KEY ("act_id") REFERENCES "public"."legal_acts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petition_signatures" ADD CONSTRAINT "petition_signatures_petition_id_petitions_id_fk" FOREIGN KEY ("petition_id") REFERENCES "public"."petitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petition_signatures" ADD CONSTRAINT "petition_signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_related_bill_id_bills_id_fk" FOREIGN KEY ("related_bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politician_controversies" ADD CONSTRAINT "politician_controversies_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politician_positions" ADD CONSTRAINT "politician_positions_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politician_positions" ADD CONSTRAINT "politician_positions_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politician_statements" ADD CONSTRAINT "politician_statements_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politician_truth_tracking" ADD CONSTRAINT "politician_truth_tracking_politician_id_politicians_id_fk" FOREIGN KEY ("politician_id") REFERENCES "public"."politicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polling_sites" ADD CONSTRAINT "polling_sites_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polling_sites" ADD CONSTRAINT "polling_sites_district_id_electoral_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."electoral_districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propaganda_detection" ADD CONSTRAINT "propaganda_detection_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provincial_variations" ADD CONSTRAINT "provincial_variations_charter_right_id_charter_rights_id_fk" FOREIGN KEY ("charter_right_id") REFERENCES "public"."charter_rights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_id_daily_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."daily_challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_messages" ADD CONSTRAINT "user_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_messages" ADD CONSTRAINT "user_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_votes" ADD CONSTRAINT "user_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");