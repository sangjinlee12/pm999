import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Search, FileText, BookOpen, MessageCircle } from 'lucide-react';

// 검색 가능한 카테고리 목록
const categories = [
  '전체',
  '일반 업무',
  '개발',
  '기획',
  '디자인',
  '마케팅',
  '회의',
  '교육',
  '기타'
];

export default function WorklogSearchPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedStatus, setSelectedStatus] = useState<string>('전체');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [activeTab, setActiveTab] = useState('daily');

  // 날짜 범위가 유효한지 확인
  const hasValidDateRange = dateRange.from && dateRange.to;

  // 업무일지 검색 쿼리
  const {
    data: dailyWorklogs = [],
    isLoading: isDailyLoading
  } = useQuery({
    queryKey: ['/api/worklogs', searchTerm, selectedCategory, dateRange],
    queryFn: async () => {
      // 검색 조건 구성
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('keyword', searchTerm);
      }
      
      if (hasValidDateRange) {
        params.append('startDate', format(dateRange.from!, 'yyyy-MM-dd'));
        params.append('endDate', format(dateRange.to!, 'yyyy-MM-dd'));
      }
      
      const res = await apiRequest('GET', `/api/worklogs?${params.toString()}`);
      return await res.json();
    },
    enabled: !!user && activeTab === 'daily'
  });

  // 주간 계획 검색 쿼리
  const {
    data: weeklyPlans = [],
    isLoading: isWeeklyLoading
  } = useQuery({
    queryKey: ['/api/weekly-plans', searchTerm, dateRange],
    queryFn: async () => {
      // 검색 조건 구성
      const params = new URLSearchParams();
      
      if (hasValidDateRange) {
        params.append('startDate', format(dateRange.from!, 'yyyy-MM-dd'));
        params.append('endDate', format(dateRange.to!, 'yyyy-MM-dd'));
      }
      
      const res = await apiRequest('GET', `/api/weekly-plans?${params.toString()}`);
      return await res.json();
    },
    enabled: !!user && activeTab === 'weekly'
  });

  // 필터링된 결과 계산
  const filteredDailyWorklogs = dailyWorklogs.filter((log: any) => {
    let matchesSearch = true;
    let matchesCategory = true;
    let matchesStatus = true;
    let matchesDateRange = true;

    // 키워드 검색
    if (searchTerm) {
      matchesSearch = 
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.content.toLowerCase().includes(searchTerm.toLowerCase());
    }

    // 카테고리 필터
    if (selectedCategory !== '전체') {
      matchesCategory = log.category === selectedCategory;
    }

    // 상태 필터
    if (selectedStatus !== '전체') {
      matchesStatus = log.status === selectedStatus;
    }

    // 날짜 범위 필터
    if (hasValidDateRange) {
      const logDate = parseISO(log.date);
      matchesDateRange = 
        isAfter(endOfDay(logDate), startOfDay(dateRange.from!)) && 
        isBefore(startOfDay(logDate), endOfDay(dateRange.to!));
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
  });

  // 필터링된 주간 계획 결과
  const filteredWeeklyPlans = weeklyPlans.filter((plan: any) => {
    let matchesSearch = true;
    let matchesDateRange = true;

    // 키워드 검색
    if (searchTerm) {
      matchesSearch = 
        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.goals.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.mondayPlan && plan.mondayPlan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (plan.tuesdayPlan && plan.tuesdayPlan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (plan.wednesdayPlan && plan.wednesdayPlan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (plan.thursdayPlan && plan.thursdayPlan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (plan.fridayPlan && plan.fridayPlan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (plan.notes && plan.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 날짜 범위 필터
    if (hasValidDateRange) {
      const planStartDate = parseISO(plan.weekStart);
      matchesDateRange = 
        isAfter(endOfDay(planStartDate), startOfDay(dateRange.from!)) && 
        isBefore(startOfDay(planStartDate), endOfDay(dateRange.to!));
    }

    return matchesSearch && matchesDateRange;
  });

  // 상태에 따른 배지 스타일
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '진행중':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">진행중</Badge>;
      case '완료':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">완료</Badge>;
      case '보류':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">보류</Badge>;
      case '취소':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">취소</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 항목 클릭 핸들러
  const handleItemClick = (type: string, id: number) => {
    if (type === 'daily') {
      navigate(`/worklog/daily?id=${id}`);
    } else {
      navigate(`/worklog/weekly?id=${id}`);
    }
  };

  // 검색 수행
  const handleSearch = () => {
    // 이미 쿼리 자동 실행됨
  };

  // 검색 조건 초기화
  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('전체');
    setSelectedStatus('전체');
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">업무 검색</h1>
      </div>

      {/* 검색 조건 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="검색어를 입력하세요"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'yyyy-MM-dd')} ~{" "}
                            {format(dateRange.to, 'yyyy-MM-dd')}
                          </>
                        ) : (
                          format(dateRange.from, 'yyyy-MM-dd')
                        )
                      ) : (
                        "날짜 범위 선택"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        if (range) {
                          setDateRange(range);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="완료">완료</SelectItem>
                  <SelectItem value="보류">보류</SelectItem>
                  <SelectItem value="취소">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={handleReset}>
                초기화
              </Button>
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                검색
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 검색 결과 탭 */}
      <Tabs defaultValue="daily" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="daily">
            <FileText className="mr-2 h-4 w-4" />
            일일 업무일지
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <BookOpen className="mr-2 h-4 w-4" />
            주간 계획
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>일일 업무일지 검색 결과</CardTitle>
              <CardDescription>
                총 {filteredDailyWorklogs.length}개의 업무일지가 검색되었습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDailyLoading ? (
                <div className="text-center py-6">로딩 중...</div>
              ) : filteredDailyWorklogs.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  검색 조건에 맞는 업무일지가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDailyWorklogs.map((log: any) => (
                    <Card key={log.id} className="overflow-hidden">
                      <div 
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleItemClick('daily', log.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-lg">{log.title}</h3>
                            <div className="text-sm text-gray-500">
                              {format(parseISO(log.date), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{log.category}</Badge>
                            {getStatusBadge(log.status)}
                          </div>
                        </div>
                        <div className="line-clamp-2 text-gray-600 mb-2">
                          {log.content}
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span>피드백 {log.feedbackCount || 0}개</span>
                          </div>
                          <div>
                            작성일: {format(parseISO(log.createdAt), 'yyyy-MM-dd HH:mm')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>주간 계획 검색 결과</CardTitle>
              <CardDescription>
                총 {filteredWeeklyPlans.length}개의 주간 계획이 검색되었습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWeeklyLoading ? (
                <div className="text-center py-6">로딩 중...</div>
              ) : filteredWeeklyPlans.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  검색 조건에 맞는 주간 계획이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredWeeklyPlans.map((plan: any) => (
                    <Card key={plan.id} className="overflow-hidden">
                      <div 
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleItemClick('weekly', plan.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-lg">{plan.title}</h3>
                            <div className="text-sm text-gray-500">
                              {format(parseISO(plan.weekStart), 'yyyy년 MM월 dd일')} 시작
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-700 mb-1">주간 목표:</div>
                          <div className="line-clamp-2 text-gray-600">
                            {plan.goals}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span>피드백 {plan.feedbackCount || 0}개</span>
                          </div>
                          <div>
                            작성일: {format(parseISO(plan.createdAt), 'yyyy-MM-dd HH:mm')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}