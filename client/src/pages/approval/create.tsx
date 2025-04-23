import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertApprovalSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X, UserPlus, Save, Send } from 'lucide-react';

// 결재 양식 스키마 확장
const approvalFormSchema = insertApprovalSchema.extend({
  approvers: z.array(
    z.object({
      userId: z.number(),
      order: z.number(),
      status: z.string().optional(),
      comment: z.string().optional()
    })
  ).min(1, '최소 한 명 이상의 결재자를 지정해야 합니다.'),
  type: z.string().default("일반기안"),
  priority: z.string().default("일반")
});

type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

export default function ApprovalCreate() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [approvers, setApprovers] = useState<Array<{id: number, name: string, department: string, position: string}>>([]);
  const [selectedApprover, setSelectedApprover] = useState<number | null>(null);

  // 사용자 목록 조회
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // 부서 목록 조회
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
    enabled: !!user,
  });

  // 결재 양식 폼
  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      title: '',
      content: '',
      type: '일반기안',
      priority: '일반',
      status: '기안됨',
      approvers: [],
      referenceUsers: [],
      attachments: []
    },
    mode: 'onChange'
  });

  // 결재 문서 생성 뮤테이션
  const createApprovalMutation = useMutation({
    mutationFn: async (values: ApprovalFormValues) => {
      const res = await apiRequest('POST', '/api/approvals', values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '결재 요청 완료',
        description: '결재 문서가 성공적으로 제출되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/approvals']});
      navigate('/approval/list');
    },
    onError: (error: Error) => {
      toast({
        title: '결재 요청 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 결재자 추가
  const addApprover = () => {
    if (!selectedApprover) return;
    
    const selectedUser = users.find((u: any) => u.id === selectedApprover);
    if (!selectedUser) return;
    
    // 이미 추가된 결재자인지 확인
    if (approvers.some(a => a.id === selectedUser.id)) {
      toast({
        title: '중복된 결재자',
        description: '이미 추가된 결재자입니다.',
        variant: 'destructive',
      });
      return;
    }
    
    // 새 결재자 배열 생성
    const newApprovers = [...approvers, selectedUser];
    setApprovers(newApprovers);
    setSelectedApprover(null);
    
    // form의 approvers 필드 업데이트
    const updatedApprovers = newApprovers.map((user, index) => ({
      userId: user.id,
      order: index + 1,
      status: '대기'
    }));
    
    // 직접 폼 값 설정
    form.setValue('approvers', updatedApprovers, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    console.log('결재자 추가 후:', updatedApprovers);
  };

  // 결재자 제거
  const removeApprover = (id: number) => {
    // 새 결재자 배열 생성
    const newApprovers = approvers.filter(a => a.id !== id);
    setApprovers(newApprovers);
    
    // form의 approvers 필드 업데이트
    const updatedApprovers = newApprovers.map((user, index) => ({
      userId: user.id,
      order: index + 1,
      status: '대기'
    }));
    
    // 직접 폼 값 설정
    form.setValue('approvers', updatedApprovers, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    console.log('결재자 제거 후:', updatedApprovers);
  };

  // 결재자 순서 변경 시 폼 업데이트
  useEffect(() => {
    if (approvers.length > 0) {
      const updatedApprovers = approvers.map((user, index) => ({
        userId: user.id,
        order: index + 1,
        status: '대기'
      }));
      
      form.setValue('approvers', updatedApprovers);
      console.log('결재자 업데이트:', updatedApprovers);
    }
  }, [approvers, form]);

  // 결재 요청 제출
  const onSubmit = (values: ApprovalFormValues) => {
    // 결재자 정보 확인
    if (!values.approvers || values.approvers.length === 0) {
      toast({
        title: '결재자 지정 필요',
        description: '최소 한 명 이상의 결재자를 지정해야 합니다.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('결재 요청 전송:', values);
    createApprovalMutation.mutate(values);
  };

  // 임시 저장
  const saveAsDraft = () => {
    const currentValues = form.getValues();
    // 임시 저장 로직 (로컬 스토리지 사용)
    localStorage.setItem('approval_draft', JSON.stringify(currentValues));
    toast({
      title: '임시 저장 완료',
      description: '결재 문서가 임시 저장되었습니다.',
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">결재 문서 작성</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>기안 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>문서 종류</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="문서 종류 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="일반기안">일반기안</SelectItem>
                            <SelectItem value="지출결의서">지출결의서</SelectItem>
                            <SelectItem value="휴가신청서">휴가신청서</SelectItem>
                            <SelectItem value="출장신청서">출장신청서</SelectItem>
                            <SelectItem value="구매요청서">구매요청서</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>중요도</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="중요도 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="일반">일반</SelectItem>
                            <SelectItem value="중요">중요</SelectItem>
                            <SelectItem value="긴급">긴급</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제목</FormLabel>
                      <FormControl>
                        <Input placeholder="제목을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>내용</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="내용을 입력하세요"
                          rows={10}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/approval/list')}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveAsDraft}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    임시 저장
                  </Button>
                  <Button type="submit" disabled={approvers.length === 0 || createApprovalMutation.isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    결재 요청
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>결재선 지정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Select onValueChange={(value) => setSelectedApprover(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="결재자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u: any) => u.id !== user?.id) // 본인 제외
                      .map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name} ({u.department} / {u.position})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addApprover} size="icon">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 결재자 목록 */}
              <div className="space-y-2">
                {approvers.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    결재자를 추가하세요
                  </div>
                ) : (
                  approvers.map((approver, index) => (
                    <div key={approver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-medium">{approver.name}</div>
                        <div className="text-sm text-gray-500">
                          {approver.department} / {approver.position}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge>{index + 1}차</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeApprover(approver.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* 결재자 유효성 검사 메시지 */}
              {form.formState.errors.approvers && (
                <p className="text-sm text-red-500 mt-2">
                  {form.formState.errors.approvers.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}