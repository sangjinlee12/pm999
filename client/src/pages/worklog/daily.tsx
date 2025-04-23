import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, startOfWeek, endOfWeek, subDays, startOfDay, endOfDay } from 'date-fns';
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
  Search, 
  Plus, 
  Edit, 
  Trash, 
  FileText, 
  FileCheck, 
  MessageCircle,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';

// 업무일지 폼 스키마
const workLogFormSchema = z.object({
  title: z.string().min(2, '제목은 2자 이상이어야 합니다.'),
  content: z.string().min(5, '내용은 5자 이상이어야 합니다.'),
  category: z.string().min(1, '카테고리를 선택하세요.'),
  status: z.string().min(1, '상태를 선택하세요.'),
  date: z.date({
    required_error: "업무 날짜를 선택하세요.",
  }),
});

type WorkLogFormValues = z.infer<typeof workLogFormSchema>;

const categories = [
  '일반 업무',
  '개발',
  '기획',
  '디자인',
  '마케팅',
  '회의',
  '교육',
  '기타'
];

const statuses = [
  '진행중',
  '완료',
  '보류',
  '취소'
];

export default function DailyWorkLogPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null);

  // 현재 선택된 날짜의 시작과 끝
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  // 현재 주의 시작과 끝
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  
  // 업무일지 목록 쿼리
  const { data: workLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/worklogs', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = format(dayStart, 'yyyy-MM-dd');
      const endDate = format(dayEnd, 'yyyy-MM-dd');
      const res = await apiRequest('GET', `/api/worklogs?startDate=${startDate}&endDate=${endDate}`);
      return await res.json();
    },
    enabled: !!user
  });

  // 피드백 개수 쿼리 (미리 불러오지 않고 필요할 때 요청)
  const getFeedbackCount = async (workLogId: number) => {
    try {
      const res = await apiRequest('GET', `/api/feedback/worklog/${workLogId}`);
      const feedbacks = await res.json();
      return feedbacks.length;
    } catch (error) {
      return 0;
    }
  };

  // 업무일지 생성 폼
  const addForm = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogFormSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '일반 업무',
      status: '진행중',
      date: new Date(),
    }
  });

  // 업무일지 수정 폼
  const editForm = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogFormSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '일반 업무',
      status: '진행중',
      date: new Date(),
    }
  });

  // 업무일지 생성 뮤테이션
  const createWorkLogMutation = useMutation({
    mutationFn: async (data: WorkLogFormValues) => {
      // 날짜를 ISO 문자열로 변환
      const formattedData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd')
      };
      const res = await apiRequest('POST', '/api/worklogs', formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '업무일지 작성 성공',
        description: '새로운 업무일지가 등록되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/worklogs']});
      addForm.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: '업무일지 작성 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 업무일지 수정 뮤테이션
  const updateWorkLogMutation = useMutation({
    mutationFn: async (data: WorkLogFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      // 날짜를 ISO 문자열로 변환
      const formattedData = {
        ...updateData,
        date: format(updateData.date, 'yyyy-MM-dd')
      };
      const res = await apiRequest('PUT', `/api/worklogs/${id}`, formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '업무일지 수정 성공',
        description: '업무일지가 업데이트되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/worklogs']});
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingWorkLog(null);
    },
    onError: (error: Error) => {
      toast({
        title: '업무일지 수정 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 업무일지 생성 폼 제출
  const onAddSubmit = (values: WorkLogFormValues) => {
    createWorkLogMutation.mutate(values);
  };

  // 업무일지 수정 폼 제출
  const onEditSubmit = (values: WorkLogFormValues) => {
    if (!editingWorkLog) return;
    
    updateWorkLogMutation.mutate({
      ...values,
      id: editingWorkLog.id
    });
  };

  // 편집 모드 시작
  const handleEdit = (workLog: any) => {
    setEditingWorkLog(workLog);
    editForm.reset({
      title: workLog.title,
      content: workLog.content,
      category: workLog.category,
      status: workLog.status,
      date: new Date(workLog.date)
    });
    setIsEditDialogOpen(true);
  };

  // 이전 날짜로 이동
  const prevDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  // 다음 날짜로 이동
  const nextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">일일 업무일지</h1>
      </div>

      {/* 날짜 선택 및 컨트롤 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={prevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={nextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              업무일지 작성
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 업무일지 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div>로딩 중...</div>
        </div>
      ) : workLogs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">업무일지가 없습니다</h3>
            <p className="text-gray-500 text-center mb-6">
              {format(selectedDate, 'yyyy년 MM월 dd일')}에 등록된 업무일지가 없습니다.<br />
              새로운 업무일지를 작성해 보세요.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              업무일지 작성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {workLogs.map((log: any) => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-1 flex-col">
                    <CardTitle className="text-xl">{log.title}</CardTitle>
                    <CardDescription>
                      {log.category} | {format(new Date(log.date), 'yyyy-MM-dd')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(log.status)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(log)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap mb-4">
                  {log.content}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 flex justify-between items-center p-2 px-6">
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-500">피드백 {log.feedbackCount || 0}개</span>
                </div>
                <div className="text-sm text-gray-500">
                  작성일: {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 업무일지 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>업무일지 작성</DialogTitle>
            <DialogDescription>
              오늘 수행한 업무 내용을 작성하세요.
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
                      <Input placeholder="업무 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상태</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>업무 날짜</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>업무 내용</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="수행한 업무 내용을 상세히 작성하세요." 
                        className="min-h-[150px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createWorkLogMutation.isPending}>업무일지 등록</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 업무일지 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>업무일지 수정</DialogTitle>
            <DialogDescription>
              업무일지 내용을 수정하세요.
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
                      <Input placeholder="업무 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상태</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>업무 날짜</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>업무 내용</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="수행한 업무 내용을 상세히 작성하세요." 
                        className="min-h-[150px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateWorkLogMutation.isPending}>
                  업무일지 수정
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}