import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ChevronDown, User, Shield, Settings, LogOut } from 'lucide-react';

interface ProfileProps {
  user: {
    name: string;
    position: string;
    department: string;
    email: string;
    image?: string;
  }
}

export default function ProfileDropdown({ user }: ProfileProps) {
  const { logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center text-sm focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="프로필 메뉴 열기"
      >
        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 mr-2">
          {user.image ? (
            <img 
              src={user.image} 
              alt={`${user.name}의 프로필`} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600">
              <User className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="hidden md:block text-left">
          <div className="font-semibold">{user.name}</div>
          <div className="text-xs text-gray-500">{user.department} / {user.position}</div>
        </div>
        <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 w-60 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={`${user.name}의 프로필`} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
          </div>
          
          <div className="py-2">
            <Link href="/settings/profile" onClick={() => setIsOpen(false)}>
              <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  프로필 설정
                </div>
              </a>
            </Link>
            <Link href="/settings/account" onClick={() => setIsOpen(false)}>
              <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-500" />
                  계정 설정
                </div>
              </a>
            </Link>
            <Link href="/settings/preferences" onClick={() => setIsOpen(false)}>
              <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <div className="flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-gray-500" />
                  환경 설정
                </div>
              </a>
            </Link>
          </div>
          
          <div className="py-2 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                로그아웃
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
