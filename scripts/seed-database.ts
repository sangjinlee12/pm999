import { db, pool } from "../server/db";
import { 
  users, 
  departments, 
  positions, 
  approvals, 
  approvalLines, 
  attendance, 
  workLogs,
  weeklyPlans, 
  feedback, 
  notifications 
} from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("🌱 데이터베이스 시드 시작...");

  try {
    // 기존 데이터 정리
    await db.delete(notifications);
    await db.delete(feedback);
    await db.delete(weeklyPlans);
    await db.delete(workLogs);
    await db.delete(attendance);
    await db.delete(approvalLines);
    await db.delete(approvals);
    await db.delete(users);
    await db.delete(positions);
    await db.delete(departments);

    console.log("✅ 기존 데이터 정리 완료");

    // 부서 생성
    const departmentsData = [
      { name: "경영지원부", code: "ADM", description: "인사, 총무, 재무 관리" },
      { name: "개발부", code: "DEV", description: "소프트웨어 개발 및 유지보수" },
      { name: "영업부", code: "SAL", description: "영업 및 마케팅" },
      { name: "기획부", code: "PLN", description: "서비스 기획 및 디자인" },
      { name: "인사부", code: "HR", description: "인사 관리 및 채용" }
    ];

    for (const dept of departmentsData) {
      await db.insert(departments).values(dept);
    }
    console.log("✅ 부서 데이터 생성 완료");

    // 직급 생성
    const positionsData = [
      { name: "사원", level: 1, description: "Junior" },
      { name: "대리", level: 2, description: "Associate" },
      { name: "과장", level: 3, description: "Manager" },
      { name: "차장", level: 4, description: "Senior Manager" },
      { name: "부장", level: 5, description: "Director" },
      { name: "이사", level: 6, description: "Executive Director" },
      { name: "상무", level: 7, description: "Managing Director" },
      { name: "전무", level: 8, description: "Executive Vice President" },
      { name: "사장", level: 9, description: "President" }
    ];

    for (const pos of positionsData) {
      await db.insert(positions).values(pos);
    }
    console.log("✅ 직급 데이터 생성 완료");

    // 사용자 생성
    const adminPassword = await hashPassword("admin1234");
    
    // 관리자 계정
    const admin = await db.insert(users).values({
      username: "admin",
      password: adminPassword,
      name: "관리자",
      email: "admin@company.com",
      department: "경영지원부",
      position: "이사",
      phone: "010-1234-5678",
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // 일반 사용자 계정
    const regularPassword = await hashPassword("user1234");
    
    const usersData = [
      {
        username: "user1",
        password: regularPassword,
        name: "홍길동",
        email: "hong@company.com",
        department: "개발부",
        position: "과장",
        phone: "010-2345-6789",
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: "user2",
        password: regularPassword,
        name: "김철수",
        email: "kim@company.com",
        department: "영업부",
        position: "대리",
        phone: "010-3456-7890",
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: "user3",
        password: regularPassword,
        name: "이영희",
        email: "lee@company.com",
        department: "기획부",
        position: "부장",
        phone: "010-4567-8901",
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const user of usersData) {
      await db.insert(users).values(user);
    }
    console.log("✅ 사용자 데이터 생성 완료");
    
    console.log("🎉 샘플 데이터 생성이 완료되었습니다!");
    console.log("관리자 계정: admin / admin1234");
    console.log("일반 계정: user1, user2, user3 / user1234");
    
  } catch (error) {
    console.error("❌ 데이터 생성 중 오류 발생:", error);
  } finally {
    // 연결 종료
    await pool.end();
  }
}

seedDatabase();