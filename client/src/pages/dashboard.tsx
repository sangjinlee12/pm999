import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  ArrowRight, 
  FileText, 
  Clock, 
  XCircle, 
  Megaphone 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Approval, WorkLog, Notification } from '@shared/schema';

type ApprovalStatus = '기안됨' | '결재중' | '승인됨' | '반려됨' | '회수됨';

// 실제 DB와 연동 전 페이지 확인을 위한 타입 정의
interface Schedule {
  id: number;
  title: string;
  location: string;
  time: string;
  startTime: Date;
}

interface Notice {
  id: number;
  title: string;
  isImportant: boolean;
  date: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const today = new Date();
  const formattedDate = format(today, 'yyyy년 MM월 dd일 EEEE', { locale: ko });

  // 대기 중인 결재 문서
  const { data: pendingApprovals = [] } = useQuery<Approval[]>({
    queryKey: ['/api/approvals', { status: '대기', isCreator: false }],
    enabled: !!user,
  });

  // 반려된 결재 문서
  const { data: rejectedApprovals = [] } = useQuery<Approval[]>({
    queryKey: ['/api/approvals', { status: '반려됨', isCreator: true }],
    enabled: !!user,
  });

  // 최근 결재 문서 목록
  const { data: recentApprovals = [] } = useQuery<Approval[]>({
    queryKey: ['/api/approvals', { isCreator: true }],
    enabled: !!user,
  });

  // 최근 업무일지
  const { data: recentWorkLogs = [] } = useQuery<WorkLog[]>({
    queryKey: ['/api/worklogs'],
    enabled: !!user,
  });

  // 알림 (미확인)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', { unreadOnly: true }],
    enabled: !!user,
  });

  // 오늘의 일정 샘플 데이터
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: 1,
      title: '개발팀 주간 회의',
      location: '3층 회의실',
      time: '오전',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0)
    },
    {
      id: 2,
      title: '신규 서비스 기획 미팅',
      location: '2층 세미나실',
      time: '오후',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30)
    },
    {
      id: 3,
      title: '신입사원 OJT 교육',
      location: '교육실',
      time: '오후',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0)
    }
  ]);

  // 공지사항 샘플 데이터
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 1,
      title: '2023년 연말정산 서류 제출 안내',
      isImportant: true,
      date: '2023-11-22'
    },
    {
      id: 2,
      title: '12월 회사 워크샵 참가 신청 안내',
      isImportant: false,
      date: '2023-11-20'
    },
    {
      id: 3,
      title: '신규 ERP 시스템 사용자 교육 일정',
      isImportant: false,
      date: '2023-11-18'
    }
  ]);

  // 출근 현황 (예시 데이터)
  const [attendanceInfo, setAttendanceInfo] = useState({
    present: 24,
    total: 25
  });

  // 문서 상태에 따른 배지 스타일
  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case '기안됨':
        return <Badge variant="info">기안됨</Badge>;
      case '결재중':
        return <Badge variant="warning">결재중</Badge>;
      case '승인됨':
        return <Badge variant="success">승인됨</Badge>;
      case '반려됨':
        return <Badge variant="danger">반려됨</Badge>;
      case '회수됨':
        return <Badge variant="gray">회수됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 업무 진행률에 따른 배지 스타일
  const getProgressBadge = (progress: number) => {
    if (progress === 100) {
      return <Badge variant="success">완료</Badge>;
    } else if (progress >= 75) {
      return <Badge variant="info">진행 {progress}%</Badge>;
    } else if (progress >= 50) {
      return <Badge variant="purple">진행 {progress}%</Badge>;
    } else {
      return <Badge variant="warning">진행 {progress}%</Badge>;
    }
  };

  return (
    <>
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">대시보드</h1>
        <div className="text-sm text-gray-600">{formattedDate}</div>
      </div>
      
      {/* 업무 상태 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 결재 대기 카드 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-primary-50 text-primary-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">결재 대기</div>
                <div className="text-2xl font-semibold">{pendingApprovals.length}</div>
              </div>
            </div>
            <div className="mt-3">
              <Link href="/approval/received" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center">
                상세 보기
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* 반려 문서 카드 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-red-50 text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">반려 문서</div>
                <div className="text-2xl font-semibold">{rejectedApprovals.length}</div>
              </div>
            </div>
            <div className="mt-3">
              <Link href="/approval/list" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center">
                상세 보기
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* 출근 현황 카드 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-green-50 text-green-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">출근 현황</div>
                <div className="text-2xl font-semibold">{attendanceInfo.present}/{attendanceInfo.total}</div>
              </div>
            </div>
            <div className="mt-3">
              <Link href="/hr/attendance" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center">
                상세 보기
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* 공지사항 카드 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-2 rounded-md bg-amber-50 text-amber-600">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">공지사항</div>
                <div className="text-2xl font-semibold">{notices.length}</div>
              </div>
            </div>
            <div className="mt-3">
              <Link href="/notices" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center">
                상세 보기
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 메인 콘텐츠 카드 2개 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 전자결재 현황 카드 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold">결재 현황</CardTitle>
            <Link href="/approval/list" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              전체보기
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">문서번호</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">제목</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">기안일</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApprovals.length > 0 ? (
                    recentApprovals.slice(0, 5).map((approval) => (
                      <tr key={approval.id}>
                        <td className="py-2 text-sm text-gray-700">{approval.documentNumber}</td>
                        <td className="py-2 text-sm text-gray-700">
                          <Link href={`/approval/${approval.id}`} className="hover:text-primary-600">
                            {approval.title}
                          </Link>
                        </td>
                        <td className="py-2 text-sm text-gray-500">
                          {format(new Date(approval.createdAt), 'yyyy-MM-dd')}
                        </td>
                        <td className="py-2">
                          {getStatusBadge(approval.status as ApprovalStatus)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                        결재 문서가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* 오늘의 일정 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold">오늘의 일정</CardTitle>
            <Link href="/schedule" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              더보기
            </Link>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {schedules.length > 0 ? (
                schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-start">
                    <div className="min-w-fit">
                      <div className="bg-primary-50 text-primary-700 rounded-md p-2 text-center min-w-[60px]">
                        <div className="text-xs font-medium">{schedule.time}</div>
                        <div className="text-lg font-bold">
                          {format(schedule.startTime, 'HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-primary-200 pl-4 pb-5">
                      <div className="font-medium">{schedule.title}</div>
                      <div className="text-sm text-gray-600">{schedule.location}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  오늘의 일정이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 최근 업무일지 및 공지사항 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 업무일지 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold">최근 업무일지</CardTitle>
            <Link href="/worklog/daily" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              전체보기
            </Link>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-1">
              {recentWorkLogs.length > 0 ? (
                recentWorkLogs.slice(0, 3).map((worklog) => (
                  <div key={worklog.id} className="p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="flex justify-between">
                      <div className="font-medium text-gray-800">{worklog.title}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(worklog.date), 'yyyy-MM-dd')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {worklog.content.length > 100 
                        ? `${worklog.content.substring(0, 100)}...` 
                        : worklog.content}
                    </div>
                    <div className="flex mt-2">
                      {getProgressBadge(worklog.progress)}
                      <Badge variant="purple" className="ml-2">개발</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  최근 업무일지가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 공지사항 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold">공지사항</CardTitle>
            <Link href="/notices" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              전체보기
            </Link>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {notices.map((notice) => (
                <Link key={notice.id} href={`/notice/${notice.id}`}>
                  <div className="block p-3 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="flex items-center">
                      {notice.isImportant && (
                        <Badge variant="danger" className="mr-2">중요</Badge>
                      )}
                      <div className="font-medium text-gray-800">{notice.title}</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{notice.date}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
