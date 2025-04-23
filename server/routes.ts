import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertApprovalSchema, insertApprovalLineSchema, insertWorkLogSchema, insertWeeklyPlanSchema, insertFeedbackSchema, insertNotificationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { summarizeWorkContent, analyzeWeeklyPlan, generateWeeklyReport } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // 인증 라우트 설정
  setupAuth(app);

  // 미들웨어: 인증 확인
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "로그인이 필요합니다." });
  };

  // 사용자 API 라우트
  app.get("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      const users = await storage.listUsers();
      // 비밀번호 정보 제거
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });

  // 부서 API 라우트
  app.get("/api/departments", async (req, res, next) => {
    try {
      const departments = await storage.listDepartments();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/departments", isAuthenticated, async (req, res, next) => {
    try {
      // 관리자만 부서 생성 가능
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "권한이 없습니다." });
      }
      const department = await storage.createDepartment(req.body);
      res.status(201).json(department);
    } catch (error) {
      next(error);
    }
  });

  // 직급 API 라우트
  app.get("/api/positions", async (req, res, next) => {
    try {
      const positions = await storage.listPositions();
      res.json(positions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/positions", isAuthenticated, async (req, res, next) => {
    try {
      // 관리자만 직급 생성 가능
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "권한이 없습니다." });
      }
      const position = await storage.createPosition(req.body);
      res.status(201).json(position);
    } catch (error) {
      next(error);
    }
  });

  // 전자결재 API 라우트
  app.get("/api/approvals", isAuthenticated, async (req, res, next) => {
    try {
      const { status, isCreator } = req.query;
      const approvals = await storage.listApprovals(
        req.user.id, 
        { 
          status: status as string,
          isCreator: isCreator === 'true'
        }
      );
      res.json(approvals);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/approvals/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "유효하지 않은 ID 형식입니다." });
      }
      
      const approval = await storage.getApproval(id);
      if (!approval) {
        return res.status(404).json({ message: "결재 문서를 찾을 수 없습니다." });
      }

      // 결재선 정보 가져오기
      const approvalLines = await storage.getApprovalLines(approval.id);
      
      res.json({ ...approval, approvalLines });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/approvals", isAuthenticated, async (req, res, next) => {
    try {
      console.log("결재 요청 수신:", req.body);
      
      // 결재자 유효성 검사
      if (!req.body.approvers || !Array.isArray(req.body.approvers) || req.body.approvers.length === 0) {
        return res.status(400).json({ message: "최소 한 명 이상의 결재자를 지정해야 합니다." });
      }
      
      const validatedData = insertApprovalSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      console.log("검증된 결재 데이터:", validatedData);
      
      const approval = await storage.createApproval(validatedData);
      
      console.log("생성된 결재:", approval);
      
      // 결재자들에게 알림 생성
      if (validatedData.approvers) {
        for (const approver of validatedData.approvers) {
          await storage.createNotification({
            userId: approver.userId,
            type: "approval",
            title: "새로운 결재 요청",
            content: `'${approval.title}' 문서의 결재가 요청되었습니다.`,
            relatedId: approval.id,
            link: `/approvals/${approval.id}`
          });
        }
      }
      
      res.status(201).json(approval);
    } catch (error) {
      console.error("결재 요청 오류:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        next(error);
      }
    }
  });

  // 결재 처리 API (승인/반려)
  app.post("/api/approvals/:id/process", isAuthenticated, async (req, res, next) => {
    try {
      const approvalId = Number(req.params.id);
      if (isNaN(approvalId)) {
        return res.status(400).json({ message: "유효하지 않은 ID 형식입니다." });
      }
      const { status, comment } = req.body;
      
      if (!["승인", "반려"].includes(status)) {
        return res.status(400).json({ message: "유효하지 않은 결재 상태입니다." });
      }
      
      // 결재선에서 현재 사용자의 결재 단계 찾기
      const approvalLines = await storage.getApprovalLines(approvalId);
      const userLine = approvalLines.find(line => line.userId === req.user.id && line.status === "대기");
      
      if (!userLine) {
        return res.status(403).json({ message: "결재 권한이 없거나 이미 처리되었습니다." });
      }
      
      // 결재 순서 확인 (이전 단계가 모두 승인되었는지)
      const previousLines = approvalLines.filter(line => line.order < userLine.order);
      if (previousLines.some(line => line.status !== "승인")) {
        return res.status(400).json({ message: "이전 결재자의 승인이 필요합니다." });
      }
      
      // 결재선 업데이트
      const updatedLine = await storage.updateApprovalLine(userLine.id, {
        status,
        comment,
        approvedAt: new Date()
      });
      
      // 문서 작성자에게 알림 생성
      const approval = await storage.getApproval(approvalId);
      if (approval) {
        await storage.createNotification({
          userId: approval.userId,
          type: "approval",
          title: status === "승인" ? "결재 승인" : "결재 반려",
          content: `'${approval.title}' 문서가 ${req.user.name}님에 의해 ${status === "승인" ? "승인" : "반려"}되었습니다.`,
          relatedId: approvalId,
          link: `/approvals/${approvalId}`
        });
      }
      
      res.json(updatedLine);
    } catch (error) {
      next(error);
    }
  });

  // 문서 회수 API
  app.post("/api/approvals/:id/withdraw", isAuthenticated, async (req, res, next) => {
    try {
      const approvalId = Number(req.params.id);
      if (isNaN(approvalId)) {
        return res.status(400).json({ message: "유효하지 않은 ID 형식입니다." });
      }
      const approval = await storage.getApproval(approvalId);
      
      if (!approval) {
        return res.status(404).json({ message: "결재 문서를 찾을 수 없습니다." });
      }
      
      // 문서 작성자만 회수 가능
      if (approval.userId !== req.user.id) {
        return res.status(403).json({ message: "문서 작성자만 회수할 수 있습니다." });
      }
      
      // 이미 승인 또는 반려된 문서는 회수 불가
      if (["승인됨", "반려됨"].includes(approval.status)) {
        return res.status(400).json({ message: "이미 처리된 문서는 회수할 수 없습니다." });
      }
      
      const updatedApproval = await storage.updateApproval(approvalId, { status: "회수됨" });
      
      // 결재자들에게 알림 생성
      const approvalLines = await storage.getApprovalLines(approvalId);
      for (const line of approvalLines) {
        if (line.status === "대기") {
          await storage.createNotification({
            userId: line.userId,
            type: "approval",
            title: "결재 문서 회수",
            content: `'${approval.title}' 문서가 작성자에 의해 회수되었습니다.`,
            relatedId: approvalId,
            link: `/approvals/${approvalId}`
          });
        }
      }
      
      res.json(updatedApproval);
    } catch (error) {
      next(error);
    }
  });

  // 근태 API 라우트
  app.post("/api/attendance/check-in", isAuthenticated, async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 오늘 이미 출근 기록이 있는지 확인
      const existingAttendance = await storage.getUserAttendance(req.user.id, today);
      
      if (existingAttendance && existingAttendance.checkIn) {
        return res.status(400).json({ message: "이미 출근 처리되었습니다." });
      }
      
      const now = new Date();
      // 오전 9시 기준으로 지각 여부 판단
      const targetTime = new Date(today);
      targetTime.setHours(9, 0, 0, 0);
      
      const status = now > targetTime ? "지각" : "정상";
      
      let attendance;
      if (existingAttendance) {
        attendance = await storage.updateAttendance(existingAttendance.id, {
          checkIn: now,
          status
        });
      } else {
        attendance = await storage.createAttendance({
          userId: req.user.id,
          date: today,
          checkIn: now,
          status
        });
      }
      
      res.status(201).json(attendance);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/attendance/check-out", isAuthenticated, async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 오늘 출근 기록이 있는지 확인
      const existingAttendance = await storage.getUserAttendance(req.user.id, today);
      
      if (!existingAttendance || !existingAttendance.checkIn) {
        return res.status(400).json({ message: "출근 기록이 없습니다." });
      }
      
      if (existingAttendance.checkOut) {
        return res.status(400).json({ message: "이미 퇴근 처리되었습니다." });
      }
      
      const now = new Date();
      // 오후 6시 기준으로 조퇴 여부 판단
      const targetTime = new Date(today);
      targetTime.setHours(18, 0, 0, 0);
      
      let status = existingAttendance.status;
      if (now < targetTime && status === "정상") {
        status = "조퇴";
      }
      
      const attendance = await storage.updateAttendance(existingAttendance.id, {
        checkOut: now,
        status
      });
      
      res.json(attendance);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/attendance", isAuthenticated, async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date();
      start.setDate(start.getDate() - 30); // 기본값: 30일 전
      
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const attendance = await storage.listAttendance(req.user.id, start, end);
      res.json(attendance);
    } catch (error) {
      next(error);
    }
  });

  // 업무일지 API 라우트
  app.get("/api/worklogs", isAuthenticated, async (req, res, next) => {
    try {
      const { startDate, endDate, keyword } = req.query;
      const filters: { startDate?: Date, endDate?: Date, keyword?: string } = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (keyword) filters.keyword = keyword as string;
      
      const worklogs = await storage.listWorkLogs(req.user.id, filters);
      res.json(worklogs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/worklogs", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertWorkLogSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const worklog = await storage.createWorkLog(validatedData);
      res.status(201).json(worklog);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        next(error);
      }
    }
  });

  app.put("/api/worklogs/:id", isAuthenticated, async (req, res, next) => {
    try {
      const worklogId = Number(req.params.id);
      if (isNaN(worklogId)) {
        return res.status(400).json({ message: "유효하지 않은 ID 형식입니다." });
      }
      const worklog = await storage.getWorkLog(worklogId);
      
      if (!worklog) {
        return res.status(404).json({ message: "업무일지를 찾을 수 없습니다." });
      }
      
      // 본인 일지만 수정 가능
      if (worklog.userId !== req.user.id) {
        return res.status(403).json({ message: "본인의 업무일지만 수정할 수 있습니다." });
      }
      
      const updatedWorklog = await storage.updateWorkLog(worklogId, req.body);
      res.json(updatedWorklog);
    } catch (error) {
      next(error);
    }
  });

  // 주간 계획 API 라우트
  app.get("/api/weekly-plans", isAuthenticated, async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date();
      end.setDate(end.getDate() + 30); // 기본값: 30일 후
      
      const weeklyPlans = await storage.listWeeklyPlans(req.user.id, start, end);
      res.json(weeklyPlans);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/weekly-plans", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertWeeklyPlanSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const weeklyPlan = await storage.createWeeklyPlan(validatedData);
      res.status(201).json(weeklyPlan);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        next(error);
      }
    }
  });

  // 피드백 API 라우트
  app.post("/api/feedback", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertFeedbackSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const feedback = await storage.createFeedback(validatedData);
      
      // 피드백 대상자에게 알림 생성
      let targetUserId;
      let title, content, link;
      
      if (validatedData.workLogId) {
        const worklog = await storage.getWorkLog(validatedData.workLogId);
        if (worklog) {
          targetUserId = worklog.userId;
          title = "업무일지 피드백";
          content = `'${worklog.title}' 업무일지에 새로운 피드백이 등록되었습니다.`;
          link = `/worklogs/${worklog.id}`;
        }
      } else if (validatedData.weeklyPlanId) {
        const weeklyPlan = await storage.getWeeklyPlan(validatedData.weeklyPlanId);
        if (weeklyPlan) {
          targetUserId = weeklyPlan.userId;
          title = "주간 계획 피드백";
          content = `${weeklyPlan.weekStart.toISOString().split('T')[0]} 시작 주간 계획에 새로운 피드백이 등록되었습니다.`;
          link = `/weekly-plans/${weeklyPlan.id}`;
        }
      }
      
      if (targetUserId && targetUserId !== req.user.id) {
        await storage.createNotification({
          userId: targetUserId,
          type: "feedback",
          title,
          content,
          relatedId: feedback.id,
          link
        });
      }
      
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        next(error);
      }
    }
  });

  app.get("/api/feedback/worklog/:id", isAuthenticated, async (req, res, next) => {
    try {
      const worklogId = Number(req.params.id);
      if (isNaN(worklogId)) {
        return res.status(400).json({ message: "유효하지 않은 ID 형식입니다." });
      }
      const feedback = await storage.listFeedbackForWorkLog(worklogId);
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/feedback/weekly-plan/:id", isAuthenticated, async (req, res, next) => {
    try {
      const weeklyPlanId = Number(req.params.id);
      if (isNaN(weeklyPlanId)) {
        return res.status(400).json({ message: "유효하지 않은 ID 형식입니다." });
      }
      const feedback = await storage.listFeedbackForWeeklyPlan(weeklyPlanId);
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });

  // 알림 API 라우트
  app.get("/api/notifications", isAuthenticated, async (req, res, next) => {
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const notifications = await storage.getUserNotifications(req.user.id, unreadOnly);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      const notificationId = Number(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "유효하지 않은 ID 형식입니다." });
      }
      await storage.markNotificationAsRead(notificationId);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req, res, next) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // AI 요약 API 라우트
  app.post("/api/ai/summarize", isAuthenticated, async (req, res, next) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "API 키가 설정되지 않았습니다." });
      }
      
      const { content } = req.body;
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "유효한 내용을 입력해주세요." });
      }
      
      console.log("요약 요청:", content.substring(0, 100) + "...");
      const summary = await summarizeWorkContent(content);
      res.json({ summary });
    } catch (error) {
      console.error("AI 요약 오류:", error);
      res.status(500).json({ message: "요약을 생성하는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/ai/analyze-plan", isAuthenticated, async (req, res, next) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "API 키가 설정되지 않았습니다." });
      }
      
      const { content } = req.body;
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "유효한 내용을 입력해주세요." });
      }
      
      const analysis = await analyzeWeeklyPlan(content);
      res.json({ analysis });
    } catch (error) {
      console.error("AI 분석 오류:", error);
      res.status(500).json({ message: "분석을 생성하는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/ai/generate-report", isAuthenticated, async (req, res, next) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "API 키가 설정되지 않았습니다." });
      }
      
      const { dailyLogs } = req.body;
      if (!dailyLogs || !Array.isArray(dailyLogs) || dailyLogs.length === 0) {
        return res.status(400).json({ message: "유효한 일일 기록을 입력해주세요." });
      }
      
      const report = await generateWeeklyReport(dailyLogs);
      res.json({ report });
    } catch (error) {
      console.error("AI 보고서 생성 오류:", error);
      res.status(500).json({ message: "보고서를 생성하는 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
