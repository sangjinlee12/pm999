import OpenAI from "openai";

// OpenAI API 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * 업무 내용을 요약하는 함수
 * @param content 요약할 업무 내용
 * @returns 요약된 내용
 */
export async function summarizeWorkContent(content: string): Promise<string> {
  try {
    const prompt = `
다음은 한국어로 작성된 업무 일지입니다. 이 내용을 명확하고 간결하게 3-5줄로 요약해주세요.
핵심 업무, 성과, 진행 상황에 초점을 맞춰주세요.
요약은 한국어로 작성해주세요.

업무 내용:
${content}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 200,
    });

    return response.choices[0].message.content || "요약을 생성할 수 없습니다.";
  } catch (error) {
    console.error("AI 요약 생성 오류:", error);
    throw new Error("AI 요약을 생성하는 중 오류가 발생했습니다.");
  }
}

/**
 * 주간 계획을 분석하고 개선 제안을 제공하는 함수
 * @param weeklyContent 주간 계획 내용
 * @returns 분석 및 개선 제안
 */
export async function analyzeWeeklyPlan(weeklyContent: string): Promise<string> {
  try {
    const prompt = `
다음은 한국어로 작성된 주간 업무 계획입니다. 
이 계획에 대한 간략한 분석과 개선 제안을 제공해주세요.
작업 간의 균형, 우선순위 설정, 시간 배분에 초점을 맞춰 조언해주세요.
분석과 조언은 한국어로 제공해주세요.

주간 계획:
${weeklyContent}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "분석을 생성할 수 없습니다.";
  } catch (error) {
    console.error("AI 분석 생성 오류:", error);
    throw new Error("AI 분석을 생성하는 중 오류가 발생했습니다.");
  }
}

/**
 * 여러 일일 업무 기록을 바탕으로 주간 보고서를 자동 생성하는 함수
 * @param dailyLogs 일일 업무 기록 배열
 * @returns 생성된 주간 보고서
 */
export async function generateWeeklyReport(dailyLogs: string[]): Promise<string> {
  try {
    const combinedLogs = dailyLogs.join("\n\n--- 다음 일자 ---\n\n");
    
    const prompt = `
다음은 일주일간의 일일 업무 기록입니다. 
이 내용을 바탕으로 주간 보고서를 생성해주세요.
주요 성과, 진행 상황, 문제점, 다음 주 계획 등의 섹션으로 구성해주세요.
보고서는 한국어로 작성해주세요.

일일 업무 기록:
${combinedLogs}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "보고서를 생성할 수 없습니다.";
  } catch (error) {
    console.error("AI 보고서 생성 오류:", error);
    throw new Error("AI 보고서를 생성하는 중 오류가 발생했습니다.");
  }
}