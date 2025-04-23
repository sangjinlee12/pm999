import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, CalendarDays, ArrowLeft, ArrowRight, PlayCircle, StopCircle } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // 현재 로그인한 사용자가 관리자인지 확인
  const isAdmin = user?.isAdmin || false;

  // 사용자 목록 쿼리 (관리자만 다른 사용자의 근태 확인 가능)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user && isAdmin
  });

  // 근태 기록 쿼리
  const { data: attendanceRecords = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/attendance', selectedUser || user?.id, format(selectedMonth, 'yyyy-MM-dd')],
    queryFn: async () => {
      const userId = selectedUser || user?.id;
      const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      const res = await apiRequest('GET', `/api/attendance?userId=${userId}&startDate=${startDate}&endDate=${endDate}`);
      return await res.json();
    },
    enabled: !!user
  });

  // 오늘 근태 기록
  const todayRecord = attendanceRecords.find(record => 
    format(new Date(record.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  // 출근 뮤테이션
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/attendance/check-in', {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '출근 처리 완료',
        description: `${format(new Date(), 'HH:mm')}에 출근 처리되었습니다.`,
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: '출근 처리 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 퇴근 뮤테이션
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/attendance/check-out', {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '퇴근 처리 완료',
        description: `${format(new Date(), 'HH:mm')}에 퇴근 처리되었습니다.`,
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: '퇴근 처리 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 출근 처리
  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  // 퇴근 처리
  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  // 이전 달로 이동
  const prevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  // 다음 달로 이동
  const nextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  // 상태에 따른 배지 스타일
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '정상':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">정상</Badge>;
      case '지각':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">지각</Badge>;
      case '조퇴':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">조퇴</Badge>;
      case '결근':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">결근</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 그 달의 모든 날짜 생성
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  });

  // 통계 계산
  const stats = {
    normal: attendanceRecords.filter(record => record.status === '정상').length,
    late: attendanceRecords.filter(record => record.status === '지각').length,
    earlyLeave: attendanceRecords.filter(record => record.status === '조퇴').length,
    absent: daysInMonth.filter(day => {
      // 주말 제외
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      // 미래 날짜 제외
      const isFuture = day > new Date();
      // 해당 날짜에 출근 기록이 없는지 확인
      const hasRecord = attendanceRecords.some(
        record => format(new Date(record.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      
      return !isWeekend && !isFuture && !hasRecord;
    }).length
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">근태 관리</h1>
      </div>

      {/* 출퇴근 카드 (오늘) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              <span>{format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}</span>
            </div>
          </CardTitle>
          <CardDescription>오늘의 출퇴근 상태를 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center border rounded-lg p-6">
              <div className="text-lg font-medium mb-2">출근 시간</div>
              {todayRecord?.checkIn ? (
                <div className="text-2xl font-bold text-primary">
                  {format(new Date(todayRecord.checkIn), 'HH:mm:ss')}
                </div>
              ) : (
                <div className="text-xl text-gray-400">미등록</div>
              )}
              <Button
                onClick={handleCheckIn}
                disabled={!!todayRecord?.checkIn}
                className="mt-4"
                variant={todayRecord?.checkIn ? "outline" : "default"}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                출근하기
              </Button>
            </div>
            
            <div className="flex flex-col items-center justify-center border rounded-lg p-6">
              <div className="text-lg font-medium mb-2">퇴근 시간</div>
              {todayRecord?.checkOut ? (
                <div className="text-2xl font-bold text-primary">
                  {format(new Date(todayRecord.checkOut), 'HH:mm:ss')}
                </div>
              ) : (
                <div className="text-xl text-gray-400">미등록</div>
              )}
              <Button
                onClick={handleCheckOut}
                disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
                className="mt-4"
                variant={todayRecord?.checkOut ? "outline" : "default"}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                퇴근하기
              </Button>
            </div>
          </div>
          {todayRecord?.status && (
            <div className="mt-4 flex justify-center">
              <div className="flex items-center space-x-2">
                <span>오늘 상태:</span>
                {getStatusBadge(todayRecord.status)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px]">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {format(selectedMonth, 'yyyy년 MM월')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => date && setSelectedMonth(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            {isAdmin && (
              <Select 
                value={selectedUser?.toString() || user?.id.toString() || ''} 
                onValueChange={(value) => setSelectedUser(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="직원 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id.toString() || 'self'}>내 근태</SelectItem>
                  {users
                    .filter(u => u.id !== user?.id)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name} ({u.department})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-green-100 p-2 mr-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">정상 출근</div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.normal}일
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-yellow-100 p-2 mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">지각</div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.late}일
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-orange-100 p-2 mr-4">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">조퇴</div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.earlyLeave}일
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-red-100 p-2 mr-4">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">결근</div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.absent}일
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 근태 기록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>근태 기록</CardTitle>
          <CardDescription>
            {format(selectedMonth, 'yyyy년 MM월')} 근태 기록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>요일</TableHead>
                  <TableHead>출근 시간</TableHead>
                  <TableHead>퇴근 시간</TableHead>
                  <TableHead>근무 시간</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">로딩 중...</TableCell>
                  </TableRow>
                ) : daysInMonth.map((day) => {
                  // 해당 날짜의 근태 기록 찾기
                  const record = attendanceRecords.find(
                    r => format(new Date(r.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                  );
                  // 주말 여부 확인
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  // 미래 날짜 여부 확인
                  const isFuture = day > new Date();
                  
                  // 근무 시간 계산
                  let workHours = '-';
                  if (record?.checkIn && record?.checkOut) {
                    const checkInTime = new Date(record.checkIn).getTime();
                    const checkOutTime = new Date(record.checkOut).getTime();
                    const diffMs = checkOutTime - checkInTime;
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    workHours = `${diffHrs}시간 ${diffMins}분`;
                  }
                  
                  return (
                    <TableRow 
                      key={format(day, 'yyyy-MM-dd')}
                      className={
                        isWeekend
                          ? "bg-gray-50"
                          : isToday(day)
                          ? "bg-blue-50"
                          : ""
                      }
                    >
                      <TableCell>{format(day, 'yyyy-MM-dd')}</TableCell>
                      <TableCell className={isWeekend ? "text-red-500" : ""}>
                        {format(day, 'EEEE', { locale: ko })}
                      </TableCell>
                      <TableCell>
                        {record?.checkIn 
                          ? format(new Date(record.checkIn), 'HH:mm:ss')
                          : isWeekend || isFuture
                          ? '-'
                          : '미출근'}
                      </TableCell>
                      <TableCell>
                        {record?.checkOut 
                          ? format(new Date(record.checkOut), 'HH:mm:ss')
                          : record?.checkIn && !isFuture
                          ? '미퇴근'
                          : '-'}
                      </TableCell>
                      <TableCell>{workHours}</TableCell>
                      <TableCell>
                        {record
                          ? getStatusBadge(record.status)
                          : isWeekend
                          ? <Badge variant="outline" className="bg-gray-50">주말</Badge>
                          : isFuture
                          ? <Badge variant="outline" className="bg-gray-50">예정</Badge>
                          : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">결근</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}