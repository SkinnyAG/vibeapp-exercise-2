import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

// Role enum
export const roleEnum = [
  "STUDENT",
  "LECTURER",
  "SYSTEM_ADMIN",
  "INSTITUTIONAL_ADMIN",
] as const;
export type Role = (typeof roleEnum)[number];

// Helper function for creating cuid-like IDs
const cuid = () => sql`(lower(hex(randomblob(16))))`;

// Helper for timestamps
const timestamp = (name: string) => integer(name, { mode: "timestamp" });

// User table
export const users = sqliteTable(
  "User",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "boolean" })
      .notNull()
      .default(false),
    name: text("name").notNull(),
    image: text("image"),
    role: text("role", { enum: roleEnum }).notNull().default("STUDENT"),
    institutionId: text("institutionId"),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index("User_email_idx").on(table.email),
    institutionIdx: index("User_institutionId_idx").on(table.institutionId),
  }),
);

// Account table for BetterAuth
export const accounts = sqliteTable(
  "Account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    expiresAt: timestamp("expiresAt"),
    password: text("password"),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("Account_userId_idx").on(table.userId),
    providerAccountIdx: uniqueIndex("Account_providerId_accountId_key").on(
      table.providerId,
      table.accountId,
    ),
  }),
);

// Session table for BetterAuth
export const sessions = sqliteTable(
  "Session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("Session_userId_idx").on(table.userId),
    tokenIdx: index("Session_token_idx").on(table.token),
  }),
);

// Verification table for BetterAuth
export const verifications = sqliteTable(
  "Verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    identifierValueIdx: uniqueIndex("Verification_identifier_value_key").on(
      table.identifier,
      table.value,
    ),
  }),
);

// Institution table
export const institutions = sqliteTable(
  "Institution",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    domain: text("domain").notNull().unique(),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    domainIdx: index("Institution_domain_idx").on(table.domain),
  }),
);

// Course table
export const courses = sqliteTable(
  "Course",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    institutionId: text("institutionId")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    semester: text("semester").notNull(),
    lecturerId: text("lecturerId")
      .notNull()
      .references(() => users.id),
    aiGuidelines: text("aiGuidelines").notNull().default(""),
    guidelineUpdatedAt: timestamp("guidelineUpdatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    lecturerIdx: index("Course_lecturerId_idx").on(table.lecturerId),
    institutionIdx: index("Course_institutionId_idx").on(table.institutionId),
    uniqueCourseIdx: uniqueIndex("Course_institutionId_code_semester_key").on(
      table.institutionId,
      table.code,
      table.semester,
    ),
  }),
);

// CourseEnrollment table
export const courseEnrollments = sqliteTable(
  "CourseEnrollment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolledAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("CourseEnrollment_userId_idx").on(table.userId),
    courseIdx: index("CourseEnrollment_courseId_idx").on(table.courseId),
    uniqueEnrollmentIdx: uniqueIndex("CourseEnrollment_userId_courseId_key").on(
      table.userId,
      table.courseId,
    ),
  }),
);

// Assignment table
export const assignments = sqliteTable(
  "Assignment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    dueDate: timestamp("dueDate").notNull(),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    courseIdx: index("Assignment_courseId_idx").on(table.courseId),
    dueDateIdx: index("Assignment_dueDate_idx").on(table.dueDate),
  }),
);

// AIUsageLog table (FR-03)
export const aiUsageLogs = sqliteTable(
  "AIUsageLog",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: text("assignmentId")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    toolName: text("toolName").notNull(),
    purposeDescription: text("purposeDescription").notNull(),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("AIUsageLog_userId_idx").on(table.userId),
    assignmentIdx: index("AIUsageLog_assignmentId_idx").on(table.assignmentId),
    createdAtIdx: index("AIUsageLog_createdAt_idx").on(table.createdAt),
  }),
);

// GuidelineFeedback table (FR-15)
export const guidelineFeedbacks = sqliteTable(
  "GuidelineFeedback",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    feedbackText: text("feedbackText").notNull(),
    isAnonymous: integer("isAnonymous", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: timestamp("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("GuidelineFeedback_userId_idx").on(table.userId),
    courseIdx: index("GuidelineFeedback_courseId_idx").on(table.courseId),
    createdAtIdx: index("GuidelineFeedback_createdAt_idx").on(table.createdAt),
  }),
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type Institution = typeof institutions.$inferSelect;
export type NewInstitution = typeof institutions.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type NewCourseEnrollment = typeof courseEnrollments.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type AIUsageLog = typeof aiUsageLogs.$inferSelect;
export type NewAIUsageLog = typeof aiUsageLogs.$inferInsert;
export type GuidelineFeedback = typeof guidelineFeedbacks.$inferSelect;
export type NewGuidelineFeedback = typeof guidelineFeedbacks.$inferInsert;
