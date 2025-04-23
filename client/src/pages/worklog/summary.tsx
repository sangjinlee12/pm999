import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WorklogSummary() {
  const { toast } = useToast();
  const [workContent, setWorkContent] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState("");
  const [dailyLogs, setDailyLogs] = useState<string[]>(Array(5).fill(""));
  const [summary, setSummary] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState({
    summary: false,
    analysis: false,
    report: false
  });

  // 워크로그 요약 요청
  const handleSummarize = async () => {
    if (!workContent.trim()) {
      toast({
        title: "내용 입력 필요",
        description: "요약할 업무 내용을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(prev => ({ ...prev, summary: true }));
    try {
      const res = await apiRequest("POST", "/api/ai/summarize", { content: workContent });
      const data = await res.json();
      setSummary(data.summary);
    } catch (error) {
      toast({
        title: "요약 오류",
        description: "업무 내용을 요약하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      console.error("요약 오류:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, summary: false }));
    }
  };

  // 주간 계획 분석 요청
  const handleAnalyzePlan = async () => {
    if (!weeklyPlan.trim()) {
      toast({
        title: "내용 입력 필요",
        description: "분석할 주간 계획을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(prev => ({ ...prev, analysis: true }));
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-plan", { content: weeklyPlan });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (error) {
      toast({
        title: "분석 오류",
        description: "주간 계획을 분석하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      console.error("분석 오류:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, analysis: false }));
    }
  };

  // 주간 보고서 생성 요청
  const handleGenerateReport = async () => {
    const filledLogs = dailyLogs.filter(log => log.trim().length > 0);
    if (filledLogs.length === 0) {
      toast({
        title: "내용 입력 필요",
        description: "최소 하나 이상의 일일 업무 기록을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(prev => ({ ...prev, report: true }));
    try {
      const res = await apiRequest("POST", "/api/ai/generate-report", { dailyLogs: filledLogs });
      const data = await res.json();
      setReport(data.report);
    } catch (error) {
      toast({
        title: "보고서 생성 오류",
        description: "주간 보고서를 생성하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      console.error("보고서 생성 오류:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, report: false }));
    }
  };

  // 일일 업무 내용 업데이트
  const updateDailyLog = (index: number, value: string) => {
    const newLogs = [...dailyLogs];
    newLogs[index] = value;
    setDailyLogs(newLogs);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">AI 업무 도우미</h1>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">업무 내용 요약</TabsTrigger>
          <TabsTrigger value="analyze">주간 계획 분석</TabsTrigger>
          <TabsTrigger value="report">주간 보고서 생성</TabsTrigger>
        </TabsList>

        {/* 업무 내용 요약 탭 */}
        <TabsContent value="summary" className="space-y-4">
          <Alert variant="default">
            <Sparkles className="h-4 w-4 mr-2" />
            <AlertDescription>
              일일 업무 내용을 입력하면 AI가 핵심만 간결하게 요약해 드립니다.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>업무 내용</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="요약할 업무 내용을 입력하세요..."
                  className="min-h-[200px]"
                  value={workContent}
                  onChange={(e) => setWorkContent(e.target.value)}
                />
                <Button 
                  className="mt-4 w-full" 
                  onClick={handleSummarize}
                  disabled={isLoading.summary || !workContent.trim()}
                >
                  {isLoading.summary && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  요약하기
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>요약 결과</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading.summary ? (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : summary ? (
                  <div className="bg-secondary/20 p-4 rounded-md min-h-[200px] whitespace-pre-line">
                    {summary}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center min-h-[200px] flex items-center justify-center">
                    왼쪽에 내용을 입력하고 요약 버튼을 클릭하세요
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 주간 계획 분석 탭 */}
        <TabsContent value="analyze" className="space-y-4">
          <Alert variant="default">
            <Sparkles className="h-4 w-4 mr-2" />
            <AlertDescription>
              주간 계획을 입력하면 AI가 분석하고 개선점을 제안해 드립니다.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>주간 계획</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="분석할 주간 계획을 입력하세요..."
                  className="min-h-[300px]"
                  value={weeklyPlan}
                  onChange={(e) => setWeeklyPlan(e.target.value)}
                />
                <Button 
                  className="mt-4 w-full" 
                  onClick={handleAnalyzePlan}
                  disabled={isLoading.analysis || !weeklyPlan.trim()}
                >
                  {isLoading.analysis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  분석하기
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>분석 결과</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading.analysis ? (
                  <div className="flex justify-center items-center min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : analysis ? (
                  <div className="bg-secondary/20 p-4 rounded-md min-h-[300px] whitespace-pre-line">
                    {analysis}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center min-h-[300px] flex items-center justify-center">
                    왼쪽에 주간 계획을 입력하고 분석 버튼을 클릭하세요
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 주간 보고서 생성 탭 */}
        <TabsContent value="report" className="space-y-4">
          <Alert variant="default">
            <Sparkles className="h-4 w-4 mr-2" />
            <AlertDescription>
              일일 업무 기록을 입력하면 AI가 종합해 주간 보고서를 생성합니다.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>일일 업무 기록</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dailyLogs.map((log, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-sm font-medium">
                        {index + 1}일차 업무
                      </label>
                      <Textarea
                        placeholder={`${index + 1}일차 업무 내용을 입력하세요...`}
                        value={log}
                        onChange={(e) => updateDailyLog(index, e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  ))}
                  <Button 
                    className="w-full" 
                    onClick={handleGenerateReport}
                    disabled={isLoading.report || dailyLogs.every(log => !log.trim())}
                  >
                    {isLoading.report && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    보고서 생성하기
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>생성된 주간 보고서</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading.report ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : report ? (
                    <div className="bg-secondary/20 p-4 rounded-md min-h-[400px] whitespace-pre-line overflow-y-auto max-h-[600px]">
                      {report}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center min-h-[400px] flex items-center justify-center">
                      왼쪽에 일일 업무 기록을 입력하고 생성 버튼을 클릭하세요
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}