import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, LayoutDashboard, FileEdit, FileText, Search, ClipboardList, User, Building2, Clock, DollarSign, CalendarCheck, CalendarRange, UserCog, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* 모바일 사이드바 */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-background border-r border-sidebar-border transform transition-transform duration-300 ease-in-out md:hidden shadow-[var(--shadow-lg)] flex flex-col overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <SidebarContent isActive={isActive} onLogout={handleLogout} />
        </div>
      </aside>

      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar-background border-r border-sidebar-border h-full overflow-hidden">
        <SidebarContent isActive={isActive} onLogout={handleLogout} />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  isActive: (path: string) => boolean;
  onLogout: () => void;
}

function SidebarContent({ isActive, onLogout }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 로고 영역 (모바일에서만 표시) */}
      <div className="p-4 flex items-center md:hidden shrink-0">
        <div className="h-9 w-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 8h10M7 12h10M7 16h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="ml-3 text-lg font-medium text-foreground">스마트 ERP</h1>
      </div>
      
      {/* 사용자 영역 */}
      <div className="px-4 py-3 mb-1 mt-2 shrink-0">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3 shadow-[var(--shadow-sm)]">
            <span className="text-sm font-medium">관</span>
          </div>
          <div>
            <div className="text-sm font-medium">관리자님, 안녕하세요!</div>
            <div className="text-xs text-muted-foreground mt-0.5">admin@smarterp.kr</div>
          </div>
        </div>
      </div>
      
      {/* 메뉴 아이템 - 스크롤 가능 영역 */}
      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 pb-8 pt-2">
          <div className="space-y-1">
            <Link href="/" className={cn(
              "nav-item",
              isActive('/') && "nav-item-active"
            )}>
              <LayoutDashboard className="h-5 w-5" />
              <span>대시보드</span>
            </Link>
            
            {/* 전자결재 메뉴 그룹 */}
            <div className="mt-6">
              <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">전자결재</h3>
              <div className="space-y-1">
                <Link href="/approval/create" className={cn(
                  "nav-item",
                  isActive('/approval/create') && "nav-item-active"
                )}>
                  <FileEdit className="h-5 w-5" />
                  <span>문서 기안</span>
                </Link>
                <Link href="/approval/list" className={cn(
                  "nav-item",
                  isActive('/approval/list') && "nav-item-active"
                )}>
                  <FileText className="h-5 w-5" />
                  <span>결재 목록</span>
                </Link>
                <Link href="/approval/received" className={cn(
                  "nav-item",
                  isActive('/approval/received') && "nav-item-active"
                )}>
                  <Search className="h-5 w-5" />
                  <span>수신 문서함</span>
                </Link>
                <Link href="/approval/drafts" className={cn(
                  "nav-item",
                  isActive('/approval/drafts') && "nav-item-active"
                )}>
                  <ClipboardList className="h-5 w-5" />
                  <span>임시 저장</span>
                </Link>
              </div>
            </div>
            
            {/* 인사관리 메뉴 그룹 */}
            <div className="mt-6">
              <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">인사관리</h3>
              <div className="space-y-1">
                <Link href="/hr/employees" className={cn(
                  "nav-item",
                  isActive('/hr/employees') && "nav-item-active"
                )}>
                  <User className="h-5 w-5" />
                  <span>직원 관리</span>
                </Link>
                <Link href="/hr/departments" className={cn(
                  "nav-item",
                  isActive('/hr/departments') && "nav-item-active"
                )}>
                  <Building2 className="h-5 w-5" />
                  <span>부서 관리</span>
                </Link>
                <Link href="/hr/attendance" className={cn(
                  "nav-item",
                  isActive('/hr/attendance') && "nav-item-active"
                )}>
                  <Clock className="h-5 w-5" />
                  <span>근태 관리</span>
                </Link>
                <Link href="/hr/salary" className={cn(
                  "nav-item",
                  isActive('/hr/salary') && "nav-item-active"
                )}>
                  <DollarSign className="h-5 w-5" />
                  <span>급여 관리</span>
                </Link>
              </div>
            </div>
            
            {/* 업무일지 메뉴 그룹 */}
            <div className="mt-6">
              <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">업무일지</h3>
              <div className="space-y-1">
                <Link href="/worklog/daily" className={cn(
                  "nav-item",
                  isActive('/worklog/daily') && "nav-item-active"
                )}>
                  <CalendarCheck className="h-5 w-5" />
                  <span>일일 업무</span>
                </Link>
                <Link href="/worklog/weekly" className={cn(
                  "nav-item",
                  isActive('/worklog/weekly') && "nav-item-active"
                )}>
                  <CalendarRange className="h-5 w-5" />
                  <span>주간 계획</span>
                </Link>
                <Link href="/worklog/search" className={cn(
                  "nav-item",
                  isActive('/worklog/search') && "nav-item-active"
                )}>
                  <Search className="h-5 w-5" />
                  <span>업무 검색</span>
                </Link>
                <Link href="/worklog/summary" className={cn(
                  "nav-item",
                  isActive('/worklog/summary') && "nav-item-active"
                )}>
                  <Sparkles className="h-5 w-5" />
                  <span>AI 업무 도우미</span>
                </Link>
              </div>
            </div>
            
            {/* 설정 메뉴 */}
            <div className="mt-6">
              <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">설정</h3>
              <div className="space-y-1">
                <Link href="/settings/profile" className={cn(
                  "nav-item",
                  isActive('/settings/profile') && "nav-item-active"
                )}>
                  <UserCog className="h-5 w-5" />
                  <span>프로필 설정</span>
                </Link>
                <Link href="/settings/notifications" className={cn(
                  "nav-item",
                  isActive('/settings/notifications') && "nav-item-active"
                )}>
                  <Bell className="h-5 w-5" />
                  <span>알림 설정</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </div>
      
      {/* 사이드바 하단 부분 */}
      <div className="p-4 shrink-0">
        <button 
          onClick={onLogout}
          className="nav-item w-full justify-start"
        >
          <LogOut className="h-5 w-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
}
