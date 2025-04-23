import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/main-layout";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

// 전자결재 페이지
import ApprovalCreate from "@/pages/approval/create";
import ApprovalList from "@/pages/approval/list";
import ApprovalReceived from "@/pages/approval/received";
import ApprovalDetail from "@/pages/approval/detail";

// 인사관리 페이지
import HrEmployees from "@/pages/hr/employees";
import HrDepartments from "@/pages/hr/departments";
import HrAttendance from "@/pages/hr/attendance";
import HrSalary from "@/pages/hr/salary";

// 업무일지 페이지 
import WorklogDaily from "@/pages/worklog/daily";
import WorklogWeekly from "@/pages/worklog/weekly";
import WorklogSearch from "@/pages/worklog/search";
import WorklogSummary from "@/pages/worklog/summary";

// 설정 페이지
import ProfileSettings from "@/pages/settings/profile";
import NotificationSettings from "@/pages/settings/notifications";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      
      {/* 전자결재 */}
      <ProtectedRoute path="/approval/create" component={ApprovalCreate} />
      <ProtectedRoute path="/approval/list" component={ApprovalList} />
      <ProtectedRoute path="/approval/received" component={ApprovalReceived} />
      <ProtectedRoute path="/approval/:id" component={ApprovalDetail} />
      <ProtectedRoute path="/approval/drafts" component={() => <div>임시 저장 페이지</div>} />
      
      {/* 인사관리 */}
      <ProtectedRoute path="/hr/employees" component={HrEmployees} />
      <ProtectedRoute path="/hr/departments" component={HrDepartments} />
      <ProtectedRoute path="/hr/attendance" component={HrAttendance} />
      <ProtectedRoute path="/hr/salary" component={HrSalary} />
      
      {/* 업무일지 */}
      <ProtectedRoute path="/worklog/daily" component={WorklogDaily} />
      <ProtectedRoute path="/worklog/weekly" component={WorklogWeekly} />
      <ProtectedRoute path="/worklog/search" component={WorklogSearch} />
      <ProtectedRoute path="/worklog/summary" component={WorklogSummary} />
      
      {/* 설정 */}
      <ProtectedRoute path="/settings/profile" component={ProfileSettings} />
      <ProtectedRoute path="/settings/notifications" component={NotificationSettings} />
      
      {/* 기타 */}
      <ProtectedRoute path="/notices" component={() => <div>공지사항 페이지</div>} />
      <ProtectedRoute path="/schedule" component={() => <div>일정 관리 페이지</div>} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
