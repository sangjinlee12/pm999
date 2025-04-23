import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  getWeek, 
  addWeeks, 
  subWeeks, 
  isWithinInterval, 
  isToday 
} from 'date-fns';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash, 
  List, 
  Check, 
  FileText,
  MessageCircle 
} from 'lucide-react';

// 주간 계획 폼 스키마
const weeklyPlanFormSchema = z.object({
  title: z.string().min(2, '제목은 2자 이상이어야 합니다.'),
  weekStart: z.date({
    required_error: "주 시작일을 선택하세요.",
  }),
  goals: z.string().min(5, '주간 목표는 5자 이상이어야 합니다.'),
  mondayPlan: z.string().optional(),
  tuesdayPlan: z.string().optional(),
  wednesdayPlan: z.string().optional(),
  thursdayPlan: z.string().optional(),
  fridayPlan: z.string().optional(),
  notes: z.string().optional(),
});

type WeeklyPlanFormValues = z.infer<typeof weeklyPlanFormSchema>;

export default function WeeklyPlanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWeeklyPlan, setEditingWeeklyPlan] = useState<any>(null);

  // 현재 선택된 주의 시작과 끝
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  // 주차 정보
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
  const weekRange = `${format(weekStart, 'yyyy-MM-dd')} ~ ${format(weekEnd, 'yyyy-MM-dd')}`;
  
  // 주간 계획 목록 쿼리
  const { data: weeklyPlans = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/weekly-plans', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');
      const res = await apiRequest('GET', `/api/weekly-plans?startDate=${startDate}&endDate=${endDate}`);
      return await res.json();
    },
    enabled: !!user
  });

  // 현재 주의 계획
  const currentWeekPlan = weeklyPlans[0]; // 주별로 하나의 계획만 있다고 가정

  // 주간 계획 생성 폼
  const addForm = useForm<WeeklyPlanFormValues>({
    resolver: zodResolver(weeklyPlanFormSchema),
    defaultValues: {
      title: `${format(weekStart, 'yyyy')}년 ${weekNumber}주차 주간 계획`,
      weekStart: weekStart,
      goals: '',
      mondayPlan: '',
      tuesdayPlan: '',
      wednesdayPlan: '',
      thursdayPlan: '',
      fridayPlan: '',
      notes: '',
    }
  });

  // 주간 계획 수정 폼
  const editForm = useForm<WeeklyPlanFormValues>({
    resolver: zodResolver(weeklyPlanFormSchema),
    defaultValues: {
      title: '',
      weekStart: weekStart,
      goals: '',
      mondayPlan: '',
      tuesdayPlan: '',
      wednesdayPlan: '',
      thursdayPlan: '',
      fridayPlan: '',
      notes: '',
    }
  });

  // 주간 계획 생성 뮤테이션
  const createWeeklyPlanMutation = useMutation({
    mutationFn: async (data: WeeklyPlanFormValues) => {
      // 날짜를 ISO 문자열로 변환
      const formattedData = {
        ...data,
        weekStart: format(data.weekStart, 'yyyy-MM-dd')
      };
      const res = await apiRequest('POST', '/api/weekly-plans', formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '주간 계획 작성 성공',
        description: '새로운 주간 계획이 등록되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/weekly-plans']});
      addForm.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: '주간 계획 작성 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 주간 계획 수정 뮤테이션
  const updateWeeklyPlanMutation = useMutation({
    mutationFn: async (data: WeeklyPlanFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      // 날짜를 ISO 문자열로 변환
      const formattedData = {
        ...updateData,
        weekStart: format(updateData.weekStart, 'yyyy-MM-dd')
      };
      const res = await apiRequest('PUT', `/api/weekly-plans/${id}`, formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '주간 계획 수정 성공',
        description: '주간 계획이 업데이트되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/weekly-plans']});
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingWeeklyPlan(null);
    },
    onError: (error: Error) => {
      toast({
        title: '주간 계획 수정 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 주간 계획 생성 폼 제출
  const onAddSubmit = (values: WeeklyPlanFormValues) => {
    createWeeklyPlanMutation.mutate(values);
  };

  // 주간 계획 수정 폼 제출
  const onEditSubmit = (values: WeeklyPlanFormValues) => {
    if (!editingWeeklyPlan) return;
    
    updateWeeklyPlanMutation.mutate({
      ...values,
      id: editingWeeklyPlan.id
    });
  };

  // 편집 모드 시작
  const handleEdit = (weeklyPlan: any) => {
    setEditingWeeklyPlan(weeklyPlan);
    editForm.reset({
      title: weeklyPlan.title,
      weekStart: new Date(weeklyPlan.weekStart),
      goals: weeklyPlan.goals,
      mondayPlan: weeklyPlan.mondayPlan || '',
      tuesdayPlan: weeklyPlan.tuesdayPlan || '',
      wednesdayPlan: weeklyPlan.wednesdayPlan || '',
      thursdayPlan: weeklyPlan.thursdayPlan || '',
      fridayPlan: weeklyPlan.fridayPlan || '',
      notes: weeklyPlan.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // 이전 주로 이동
  const prevWeek = () => {
    setSelectedWeek(subWeeks(selectedWeek, 1));
  };

  // 다음 주로 이동
  const nextWeek = () => {
    setSelectedWeek(addWeeks(selectedWeek, 1));
  };

  // 주간 날짜 배열
  const weekdays = eachDayOfInterval({
    start: weekStart,
    end: weekEnd
  }).slice(0, 5); // 월-금만 표시

  // 날짜별 계획 내용 가져오기
  const getDayPlan = (day: Date) => {
    if (!currentWeekPlan) return null;
    
    const dayOfWeek = format(day, 'EEEE', { locale: ko });
    
    switch (dayOfWeek) {
      case '월요일':
        return currentWeekPlan.mondayPlan;
      case '화요일':
        return currentWeekPlan.tuesdayPlan;
      case '수요일':
        return currentWeekPlan.wednesdayPlan;
      case '목요일':
        return currentWeekPlan.thursdayPlan;
      case '금요일':
        return currentWeekPlan.fridayPlan;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">주간 계획</h1>
      </div>

      {/* 주 선택 및 컨트롤 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[240px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(weekStart, 'yyyy')}년 {weekNumber}주차 ({weekRange})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={weekStart}
                    onSelect={(date) => date && setSelectedWeek(startOfWeek(date, { weekStartsOn: 1 }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              disabled={!!currentWeekPlan}
            >
              <Plus className="h-4 w-4 mr-2" />
              주간 계획 작성
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 주간 계획 출력 */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div>로딩 중...</div>
        </div>
      ) : !currentWeekPlan ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">주간 계획이 없습니다</h3>
            <p className="text-gray-500 text-center mb-6">
              {format(weekStart, 'yyyy')}년 {weekNumber}주차 ({weekRange})에 등록된 주간 계획이 없습니다.<br />
              새로운 주간 계획을 작성해 보세요.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              주간 계획 작성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{currentWeekPlan.title}</CardTitle>
                  <CardDescription>
                    {format(weekStart, 'yyyy')}년 {weekNumber}주차 ({weekRange})
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEdit(currentWeekPlan)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">주간 목표</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {currentWeekPlan.goals}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">일별 계획</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {weekdays.map((day) => (
                    <Card key={format(day, 'yyyy-MM-dd')} className={`
                      ${isToday(day) ? 'border-primary' : ''}
                    `}>
                      <CardHeader className="py-2 px-4 bg-gray-50">
                        <CardTitle className="text-sm font-medium flex justify-between items-center">
                          <span>{format(day, 'EEEE', { locale: ko })}</span>
                          <span className="text-gray-500 text-xs">{format(day, 'MM/dd')}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-sm min-h-[100px]">
                        {getDayPlan(day) ? (
                          <div className="whitespace-pre-wrap">
                            {getDayPlan(day)}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic text-center mt-4">
                            계획 없음
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {currentWeekPlan.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-2">메모</h3>
                  <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {currentWeekPlan.notes}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-gray-50 flex justify-between items-center p-2 px-6">
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm text-gray-500">피드백 {currentWeekPlan.feedbackCount || 0}개</span>
              </div>
              <div className="text-sm text-gray-500">
                작성일: {format(new Date(currentWeekPlan.createdAt), 'yyyy-MM-dd HH:mm')}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* 주간 계획 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>주간 계획 작성</DialogTitle>
            <DialogDescription>
              {format(weekStart, 'yyyy')}년 {weekNumber}주차 ({weekRange}) 주간 계획을 작성하세요.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="주간 계획 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="weekStart"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>주 시작일</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'yyyy년 MM월 dd일')
                            ) : (
                              <span>날짜를 선택하세요</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      월요일을 기준으로 주가 시작됩니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주간 목표</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="이번 주 달성하고자 하는 목표를 작성하세요." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="mondayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>월요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="월요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="tuesdayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>화요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="화요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="wednesdayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="수요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="thursdayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>목요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="목요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="fridayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>금요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="금요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>기타 메모</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="추가 메모 사항을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={createWeeklyPlanMutation.isPending}>주간 계획 등록</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 주간 계획 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>주간 계획 수정</DialogTitle>
            <DialogDescription>
              주간 계획을 수정하세요.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="주간 계획 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주간 목표</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="이번 주 달성하고자 하는 목표를 작성하세요." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="mondayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>월요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="월요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="tuesdayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>화요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="화요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="wednesdayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="수요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="thursdayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>목요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="목요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="fridayPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>금요일 계획</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="금요일 계획을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>기타 메모</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="추가 메모 사항을 입력하세요." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={updateWeeklyPlanMutation.isPending}>
                  주간 계획 수정
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}