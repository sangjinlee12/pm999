import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 사용자 테이블
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  department: text("department"),
  position: text("position"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  department: true,
  position: true,
  phone: true,
  profileImage: true,
  isAdmin: true,
});

// 부서 테이블
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  code: true,
  description: true,
});

// 직급 테이블
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  salaryGrade: text("salary_grade"),
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  name: true,
  level: true,
  salaryGrade: true,
});

// 전자결재 문서 테이블
export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").notNull(),
  documentNumber: text("document_number").notNull(),
  status: text("status").notNull().default("기안됨"), // 기안됨, 결재중, 승인됨, 반려됨, 회수됨
  type: text("type").notNull().default("일반기안"), // 일반기안, 지출결의서, 휴가신청서, 출장신청서, 구매요청서
  priority: text("priority").notNull().default("일반"), // 일반, 중요, 긴급
  referenceUsers: text("reference_users").array(),
  attachments: text("attachments").array(),
});

export const insertApprovalSchema = createInsertSchema(approvals)
  .omit({ id: true, createdAt: true, documentNumber: true })
  .extend({
    approvers: z.array(z.object({
      userId: z.number(),
      order: z.number(),
      status: z.string().default("대기"),
      comment: z.string().optional(),
    })),
    type: z.string().default("일반기안"),
    priority: z.string().default("일반"),
  });

// 결재선 테이블
export const approvalLines = pgTable("approval_lines", {
  id: serial("id").primaryKey(),
  approvalId: integer("approval_id").notNull(),
  userId: integer("user_id").notNull(),
  order: integer("order").notNull(),
  status: text("status").notNull().default("대기"), // 대기, 승인, 반려
  approvedAt: timestamp("approved_at"),
  comment: text("comment"),
});

export const insertApprovalLineSchema = createInsertSchema(approvalLines).omit({
  id: true,
  approvedAt: true,
});

// 근태 관리 테이블
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  status: text("status"), // 정상, 지각, 조퇴, 결근, 휴가
  comment: text("comment"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

// 업무일지 테이블
export const workLogs = pgTable("work_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  timeSpent: integer("time_spent"), // 분 단위
  completed: boolean("completed").default(false),
  progress: integer("progress").default(0), // 0-100 진행률
});

export const insertWorkLogSchema = createInsertSchema(workLogs).omit({
  id: true,
});

// 주간 계획 테이블
export const weeklyPlans = pgTable("weekly_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  goals: text("goals").notNull(),
  progress: integer("progress").default(0), // 0-100 진행률
});

export const insertWeeklyPlanSchema = createInsertSchema(weeklyPlans).omit({
  id: true,
});

// 피드백 테이블
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  workLogId: integer("work_log_id"),
  weeklyPlanId: integer("weekly_plan_id"),
  userId: integer("user_id").notNull(), // 피드백 작성자
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

// 알림 테이블
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // 알림 수신자
  type: text("type").notNull(), // approval, feedback, system
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  relatedId: integer("related_id"), // 관련 문서/업무일지 ID
  link: text("link"), // 알림 클릭 시 이동할 링크
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// 타입 내보내기
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;

export type ApprovalLine = typeof approvalLines.$inferSelect;
export type InsertApprovalLine = z.infer<typeof insertApprovalLineSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type WorkLog = typeof workLogs.$inferSelect;
export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = z.infer<typeof insertWeeklyPlanSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
