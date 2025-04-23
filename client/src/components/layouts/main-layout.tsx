import { ReactNode, useState, useEffect } from 'react';
import Sidebar from '@/components/shared/sidebar';
import NotificationDropdown from '@/components/shared/notification-dropdown';
import ProfileDropdown from '@/components/shared/profile-dropdown';
import QuickActions from '@/components/shared/quick-actions';
import { ThemeSelector } from '@/components/shared/theme-selector';
import { ThemeProvider } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Menu, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isMobile = useIsMobile();
  const formattedDate = format(currentTime, 'yyyy년 MM월 dd일 EEEE', { locale: ko });
  const formattedTime = format(currentTime, 'HH:mm', { locale: ko });

  // 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 갱신
    
    return () => clearInterval(timer);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-0 w-full bg-card h-14 z-30 shadow-[var(--shadow-sm)] flex items-center px-4">
        {/* 좌측 영역 */}
        <div className="flex items-center">
          {/* 모바일 메뉴 버튼 */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="shadow-none rounded-full"
            onClick={toggleMobileMenu}
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5 text-primary" />
          </Button>
          
          {/* 로고 */}
          <div className="ml-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8h10M7 12h10M7 16h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-medium text-lg hidden sm:inline-block">스마트 ERP</span>
          </div>
        </div>

        {/* 검색창 */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text" 
              placeholder="검색어를 입력하세요..." 
              className="pl-9 w-full bg-secondary border-0 shadow-none focus-visible:ring-1 rounded-full"
            />
          </div>
        </div>
        
        {/* 우측 액션 아이템들 */}
        <div className="ml-auto flex items-center gap-1">
          {/* 날짜 표시 */}
          <div className="hidden lg:flex items-center mr-2">
            <div className="text-sm text-muted-foreground">
              {formattedDate}
            </div>
          </div>
          
          {/* 알림 아이콘 */}
          <NotificationDropdown />
          
          {/* 테마 선택기 */}
          <ThemeSelector />
          
          {/* 프로필 드롭다운 */}
          <ProfileDropdown 
            user={{
              name: user?.name || '사용자',
              position: user?.position || '',
              department: user?.department || '',
              email: user?.email || '',
              image: user?.profileImage || ''
            }} 
          />
        </div>
      </header>

      {/* 콘텐츠 영역 플렉스 컨테이너 */}
      <div className="flex w-full h-full pt-14">
        {/* 사이드바 (데스크톱) */}
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />

        {/* 모바일 사이드바 오버레이 */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 md:p-6">
          <div className="fade-in max-w-7xl mx-auto">
            {children}
          </div>
          
          {/* 퀵 액션 버튼 */}
          <QuickActions />
        </main>
      </div>
    </div>
  );
}
