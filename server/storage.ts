import { 
  users, type User, type InsertUser,
  departments, type Department, type InsertDepartment,
  positions, type Position, type InsertPosition,
  approvals, type Approval, type InsertApproval,
  approvalLines, type ApprovalLine, type InsertApprovalLine,
  attendance, type Attendance, type InsertAttendance,
  workLogs, type WorkLog, type InsertWorkLog,
  weeklyPlans, type WeeklyPlan, type InsertWeeklyPlan,
  feedback, type Feedback, type InsertFeedback,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;

  // 사용자 관리
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(filters?: { department?: string, position?: string }): Promise<User[]>;
  getUsersCount(): Promise<number>;

  // 부서 관리
  createDepartment(department: InsertDepartment): Promise<Department>;
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByCode(code: string): Promise<Department | undefined>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  listDepartments(): Promise<Department[]>;

  // 직급 관리
  createPosition(position: InsertPosition): Promise<Position>;
  getPosition(id: number): Promise<Position | undefined>;
  updatePosition(id: number, position: Partial<Position>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;
  listPositions(): Promise<Position[]>;

  // 전자결재 관리
  createApproval(approval: InsertApproval): Promise<Approval>;
  getApproval(id: number): Promise<Approval | undefined>;
  updateApproval(id: number, approval: Partial<Approval>): Promise<Approval | undefined>;
  listApprovals(userId: number, filters?: { status?: string, isCreator?: boolean }): Promise<Approval[]>;
  
  // 결재선 관리
  createApprovalLine(approvalLine: InsertApprovalLine): Promise<ApprovalLine>;
  updateApprovalLine(id: number, approvalLine: Partial<ApprovalLine>): Promise<ApprovalLine | undefined>;
  getApprovalLines(approvalId: number): Promise<ApprovalLine[]>;

  // 근태 관리
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  getAttendance(id: number): Promise<Attendance | undefined>;
  getUserAttendance(userId: number, date: Date): Promise<Attendance | undefined>;
  listAttendance(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]>;

  // 업무일지 관리
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  getWorkLog(id: number): Promise<WorkLog | undefined>;
  updateWorkLog(id: number, workLog: Partial<WorkLog>): Promise<WorkLog | undefined>;
  listWorkLogs(userId: number, filters?: { startDate?: Date, endDate?: Date, keyword?: string }): Promise<WorkLog[]>;

  // 주간 계획 관리
  createWeeklyPlan(weeklyPlan: InsertWeeklyPlan): Promise<WeeklyPlan>;
  getWeeklyPlan(id: number): Promise<WeeklyPlan | undefined>;
  updateWeeklyPlan(id: number, weeklyPlan: Partial<WeeklyPlan>): Promise<WeeklyPlan | undefined>;
  getUserCurrentWeeklyPlan(userId: number, date: Date): Promise<WeeklyPlan | undefined>;
  listWeeklyPlans(userId: number, startDate: Date, endDate: Date): Promise<WeeklyPlan[]>;

  // 피드백 관리
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(id: number): Promise<Feedback | undefined>;
  listFeedbackForWorkLog(workLogId: number): Promise<Feedback[]>;
  listFeedbackForWeeklyPlan(weeklyPlanId: number): Promise<Feedback[]>;

  // 알림 관리
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: User[] = [];
  private departments: Department[] = [];
  private positions: Position[] = [];
  private approvals: Approval[] = [];
  private approvalLines: ApprovalLine[] = [];
  private attendance: Attendance[] = [];
  private workLogs: WorkLog[] = [];
  private weeklyPlans: WeeklyPlan[] = [];
  private feedbacks: Feedback[] = [];
  private notifications: Notification[] = [];
  private counters = {
    users: 0,
    departments: 0,
    positions: 0,
    approvals: 0,
    approvalLines: 0,
    attendance: 0,
    workLogs: 0,
    weeklyPlans: 0,
    feedbacks: 0,
    notifications: 0
  };

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 매일 만료된 세션 정리
    });
    
    // 초기 데이터 추가
    this.initData();
  }
  
  private initData() {
    // 관리자 계정 추가
    this.users.push({
      id: ++this.counters.users,
      username: 'admin',
      password: '$2b$10$NaFgzPPPp5Lv1kA7mxCKpOBFcE.9Yw7BhUQSrJ2pvTKmKd3X9CKO.', // admin1234
      name: '관리자',
      email: 'admin@example.com',
      department: '경영지원부',
      position: '관리자',
      isAdmin: true,
      phone: null,
      profileImage: null
    });
    
    // 샘플 부서 추가
    this.departments.push({
      id: ++this.counters.departments,
      name: '경영지원부',
      code: 'ADM',
      description: '인사, 총무, 재무 업무 담당'
    });
    
    this.departments.push({
      id: ++this.counters.departments,
      name: '개발부',
      code: 'DEV',
      description: '소프트웨어 개발 및 유지보수'
    });
    
    this.departments.push({
      id: ++this.counters.departments,
      name: '영업부',
      code: 'SAL',
      description: '영업 및 마케팅 업무 담당'
    });
    
    // 샘플 직급 추가
    const positionsData = [
      { name: '사원', level: 1, salaryGrade: '1' },
      { name: '대리', level: 2, salaryGrade: '2' },
      { name: '과장', level: 3, salaryGrade: '3' },
      { name: '차장', level: 4, salaryGrade: '4' },
      { name: '부장', level: 5, salaryGrade: '5' },
      { name: '이사', level: 6, salaryGrade: '6' }
    ];
    
    positionsData.forEach(pos => {
      this.positions.push({
        id: ++this.counters.positions,
        name: pos.name,
        level: pos.level,
        salaryGrade: pos.salaryGrade
      });
    });
  }

  // 사용자 관리
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: ++this.counters.users,
      ...user,
      phone: user.phone || null,
      profileImage: user.profileImage || null,
      isAdmin: user.isAdmin || false,
      department: user.department || null,
      position: user.position || null
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    const updatedUser = {
      ...this.users[index],
      ...userData
    };
    
    this.users[index] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }

  async listUsers(filters?: { department?: string, position?: string }): Promise<User[]> {
    let result = [...this.users];
    
    if (filters?.department) {
      result = result.filter(u => u.department === filters.department);
    }
    
    if (filters?.position) {
      result = result.filter(u => u.position === filters.position);
    }
    
    return result;
  }
  
  async getUsersCount(): Promise<number> {
    return this.users.length;
  }

  // 부서 관리
  async createDepartment(department: InsertDepartment): Promise<Department> {
    const newDepartment: Department = {
      id: ++this.counters.departments,
      ...department,
      description: department.description || null
    };
    this.departments.push(newDepartment);
    return newDepartment;
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.find(d => d.id === id);
  }

  async getDepartmentByCode(code: string): Promise<Department | undefined> {
    return this.departments.find(d => d.code === code);
  }

  async updateDepartment(id: number, departmentData: Partial<Department>): Promise<Department | undefined> {
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    
    const updatedDepartment = {
      ...this.departments[index],
      ...departmentData
    };
    
    this.departments[index] = updatedDepartment;
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return false;
    
    this.departments.splice(index, 1);
    return true;
  }

  async listDepartments(): Promise<Department[]> {
    return [...this.departments];
  }

  // 직급 관리
  async createPosition(position: InsertPosition): Promise<Position> {
    const newPosition: Position = {
      id: ++this.counters.positions,
      ...position,
      salaryGrade: position.salaryGrade || null
    };
    this.positions.push(newPosition);
    return newPosition;
  }

  async getPosition(id: number): Promise<Position | undefined> {
    return this.positions.find(p => p.id === id);
  }

  async updatePosition(id: number, positionData: Partial<Position>): Promise<Position | undefined> {
    const index = this.positions.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    const updatedPosition = {
      ...this.positions[index],
      ...positionData
    };
    
    this.positions[index] = updatedPosition;
    return updatedPosition;
  }

  async deletePosition(id: number): Promise<boolean> {
    const index = this.positions.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.positions.splice(index, 1);
    return true;
  }

  async listPositions(): Promise<Position[]> {
    return [...this.positions];
  }

  // 전자결재 관리
  async createApproval(approval: InsertApproval): Promise<Approval> {
    try {
      // Generate document number (AP-YYYY-XXXX)
      const year = new Date().getFullYear();
      const docNum = `AP-${year}-${(this.counters.approvals + 1).toString().padStart(4, '0')}`;
      
      // 필요한 데이터만 추출
      const { approvers, ...approvalData } = approval;
      
      console.log("결재 생성 데이터:", { ...approvalData, documentNumber: docNum });
      
      // 결재 문서 생성
      const newApproval: Approval = {
        id: ++this.counters.approvals,
        ...approvalData,
        documentNumber: docNum,
        status: '기안됨',
        createdAt: new Date(),
        referenceUsers: approvalData.referenceUsers || null,
        attachments: approvalData.attachments || null
      };
      
      this.approvals.push(newApproval);
      console.log("생성된 결재 문서:", newApproval);
      
      // 결재선 추가
      if (approvers && approvers.length > 0) {
        for (const approver of approvers) {
          console.log("결재선 추가:", { 
            approvalId: newApproval.id,
            userId: approver.userId,
            order: approver.order, 
            status: approver.status || '대기'
          });
          
          const newApprovalLine: ApprovalLine = {
            id: ++this.counters.approvalLines,
            approvalId: newApproval.id,
            userId: approver.userId,
            order: approver.order,
            status: approver.status || '대기',
            comment: approver.comment || null,
            approvedAt: null
          };
          
          this.approvalLines.push(newApprovalLine);
        }
      }
      
      return newApproval;
    } catch (error) {
      console.error("결재 문서 생성 중 오류:", error);
      throw error;
    }
  }

  async getApproval(id: number): Promise<Approval | undefined> {
    return this.approvals.find(a => a.id === id);
  }

  async updateApproval(id: number, approvalData: Partial<Approval>): Promise<Approval | undefined> {
    const index = this.approvals.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    const updatedApproval = {
      ...this.approvals[index],
      ...approvalData
    };
    
    this.approvals[index] = updatedApproval;
    return updatedApproval;
  }

  async listApprovals(userId: number, filters?: { status?: string, isCreator?: boolean }): Promise<Approval[]> {
    let results: Approval[] = [];
    
    if (filters?.isCreator) {
      results = this.approvals.filter(a => a.userId === userId);
    } else {
      // 사용자가 결재자인 문서 검색
      const userApprovalLines = this.approvalLines.filter(line => line.userId === userId);
      const approvalIds = userApprovalLines.map(line => line.approvalId);
      results = this.approvals.filter(a => approvalIds.includes(a.id));
    }
    
    if (filters?.status) {
      results = results.filter(a => a.status === filters.status);
    }
    
    // 최신순 정렬
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 결재선 관리
  async createApprovalLine(approvalLine: InsertApprovalLine): Promise<ApprovalLine> {
    const newApprovalLine: ApprovalLine = {
      id: ++this.counters.approvalLines,
      ...approvalLine,
      comment: approvalLine.comment || null,
      approvedAt: null
    };
    
    this.approvalLines.push(newApprovalLine);
    return newApprovalLine;
  }

  async updateApprovalLine(id: number, approvalLineData: Partial<ApprovalLine>): Promise<ApprovalLine | undefined> {
    const index = this.approvalLines.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    const updatedApprovalLine = {
      ...this.approvalLines[index],
      ...approvalLineData
    };
    
    this.approvalLines[index] = updatedApprovalLine;
    
    // 결재 상태 업데이트 로직 추가
    if (approvalLineData.status) {
      const approval = await this.getApproval(this.approvalLines[index].approvalId);
      if (approval) {
        const allLines = await this.getApprovalLines(approval.id);
        
        // 결재 거부시 문서 반려 처리
        if (approvalLineData.status === '반려') {
          await this.updateApproval(approval.id, { status: '반려됨' });
        } else {
          // 모든 결재자가 승인했는지 확인
          const allApproved = allLines.every(line => line.status === '승인');
          if (allApproved) {
            await this.updateApproval(approval.id, { status: '승인됨' });
          } else {
            await this.updateApproval(approval.id, { status: '결재중' });
          }
        }
      }
    }
    
    return updatedApprovalLine;
  }

  async getApprovalLines(approvalId: number): Promise<ApprovalLine[]> {
    const lines = this.approvalLines.filter(a => a.approvalId === approvalId);
    return lines.sort((a, b) => a.order - b.order);
  }

  // 근태 관리
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const newAttendance: Attendance = {
      id: ++this.counters.attendance,
      ...attendanceData,
      status: attendanceData.status || null,
      comment: attendanceData.comment || null,
      checkIn: attendanceData.checkIn || null,
      checkOut: attendanceData.checkOut || null
    };
    
    this.attendance.push(newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const index = this.attendance.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    const updatedAttendance = {
      ...this.attendance[index],
      ...attendanceData
    };
    
    this.attendance[index] = updatedAttendance;
    return updatedAttendance;
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.find(a => a.id === id);
  }

  async getUserAttendance(userId: number, date: Date): Promise<Attendance | undefined> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return this.attendance.find(a => {
      const recordDate = new Date(a.date);
      recordDate.setHours(0, 0, 0, 0);
      return a.userId === userId && recordDate.getTime() === targetDate.getTime();
    });
  }

  async listAttendance(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const results = this.attendance.filter(a => {
      return (
        a.userId === userId &&
        a.date >= start &&
        a.date <= end
      );
    });
    
    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // 업무일지 관리
  async createWorkLog(workLog: InsertWorkLog): Promise<WorkLog> {
    const newWorkLog: WorkLog = {
      id: ++this.counters.workLogs,
      ...workLog,
      timeSpent: workLog.timeSpent || null,
      completed: workLog.completed || null,
      progress: workLog.progress || null
    };
    
    this.workLogs.push(newWorkLog);
    return newWorkLog;
  }

  async getWorkLog(id: number): Promise<WorkLog | undefined> {
    return this.workLogs.find(w => w.id === id);
  }

  async updateWorkLog(id: number, workLogData: Partial<WorkLog>): Promise<WorkLog | undefined> {
    const index = this.workLogs.findIndex(w => w.id === id);
    if (index === -1) return undefined;
    
    const updatedWorkLog = {
      ...this.workLogs[index],
      ...workLogData
    };
    
    this.workLogs[index] = updatedWorkLog;
    return updatedWorkLog;
  }

  async listWorkLogs(userId: number, filters?: { startDate?: Date, endDate?: Date, keyword?: string }): Promise<WorkLog[]> {
    let results = this.workLogs.filter(w => w.userId === userId);
    
    if (filters?.startDate && filters?.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      
      results = results.filter(w => w.date >= start && w.date <= end);
    }
    
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      results = results.filter(w => 
        w.title.toLowerCase().includes(keyword) || 
        w.content.toLowerCase().includes(keyword)
      );
    }
    
    return results.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // 주간 계획 관리
  async createWeeklyPlan(weeklyPlan: InsertWeeklyPlan): Promise<WeeklyPlan> {
    const newWeeklyPlan: WeeklyPlan = {
      id: ++this.counters.weeklyPlans,
      ...weeklyPlan,
      progress: weeklyPlan.progress || null
    };
    
    this.weeklyPlans.push(newWeeklyPlan);
    return newWeeklyPlan;
  }

  async getWeeklyPlan(id: number): Promise<WeeklyPlan | undefined> {
    return this.weeklyPlans.find(w => w.id === id);
  }

  async updateWeeklyPlan(id: number, weeklyPlanData: Partial<WeeklyPlan>): Promise<WeeklyPlan | undefined> {
    const index = this.weeklyPlans.findIndex(w => w.id === id);
    if (index === -1) return undefined;
    
    const updatedWeeklyPlan = {
      ...this.weeklyPlans[index],
      ...weeklyPlanData
    };
    
    this.weeklyPlans[index] = updatedWeeklyPlan;
    return updatedWeeklyPlan;
  }

  async getUserCurrentWeeklyPlan(userId: number, date: Date): Promise<WeeklyPlan | undefined> {
    const targetDate = new Date(date);
    
    return this.weeklyPlans.find(w => 
      w.userId === userId && 
      w.weekStart <= targetDate && 
      w.weekEnd >= targetDate
    );
  }

  async listWeeklyPlans(userId: number, startDate: Date, endDate: Date): Promise<WeeklyPlan[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const results = this.weeklyPlans.filter(w => 
      w.userId === userId && 
      ((w.weekStart >= start && w.weekStart <= end) || 
      (w.weekEnd >= start && w.weekEnd <= end))
    );
    
    return results.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }

  // 피드백 관리
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const newFeedback: Feedback = {
      id: ++this.counters.feedbacks,
      ...feedbackData,
      workLogId: feedbackData.workLogId || null,
      weeklyPlanId: feedbackData.weeklyPlanId || null,
      createdAt: new Date()
    };
    
    this.feedbacks.push(newFeedback);
    return newFeedback;
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.find(f => f.id === id);
  }

  async listFeedbackForWorkLog(workLogId: number): Promise<Feedback[]> {
    const results = this.feedbacks.filter(f => f.workLogId === workLogId);
    return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async listFeedbackForWeeklyPlan(weeklyPlanId: number): Promise<Feedback[]> {
    const results = this.feedbacks.filter(f => f.weeklyPlanId === weeklyPlanId);
    return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // 알림 관리
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: ++this.counters.notifications,
      ...notification,
      isRead: notification.isRead || false,
      link: notification.link || null,
      relatedId: notification.relatedId || null,
      createdAt: new Date()
    };
    
    this.notifications.push(newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: number, unreadOnly?: boolean): Promise<Notification[]> {
    let results = this.notifications.filter(n => n.userId === userId);
    
    if (unreadOnly) {
      results = results.filter(n => n.isRead === false);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return false;
    
    this.notifications[index].isRead = true;
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    let updated = false;
    
    this.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        updated = true;
      }
    });
    
    return updated;
  }
}

export const storage = new MemStorage();