import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Department } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Edit, Trash, Users } from 'lucide-react';

// 부서 생성 폼 스키마
const departmentFormSchema = z.object({
  name: z.string().min(2, '부서명은 2자 이상이어야 합니다.'),
  code: z.string().min(2, '부서 코드는 2자 이상이어야 합니다.'),
  description: z.string().optional()
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 부서 목록 쿼리
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    enabled: !!user
  });

  // 사용자 목록 쿼리 (부서별 인원수 계산용)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user
  });

  // 부서 생성 폼
  const addForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: ''
    }
  });

  // 부서 수정 폼
  const editForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: ''
    }
  });

  // 부서 추가 뮤테이션
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues) => {
      const res = await apiRequest('POST', '/api/departments', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '부서 추가 성공',
        description: '새로운 부서가 등록되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/departments']});
      addForm.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: '부서 추가 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 부서 수정 뮤테이션
  const updateDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest('PUT', `/api/departments/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '부서 정보 수정 성공',
        description: '부서 정보가 업데이트되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/departments']});
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
    },
    onError: (error: Error) => {
      toast({
        title: '부서 정보 수정 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 부서 삭제 뮤테이션
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: number) => {
      const res = await apiRequest('DELETE', `/api/departments/${departmentId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '부서 삭제 성공',
        description: '부서가 삭제되었습니다.',
      });
      queryClient.invalidateQueries({queryKey: ['/api/departments']});
    },
    onError: (error: Error) => {
      toast({
        title: '부서 삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 부서 추가 폼 제출
  const onAddSubmit = (values: DepartmentFormValues) => {
    createDepartmentMutation.mutate(values);
  };

  // 부서 수정 폼 제출
  const onEditSubmit = (values: DepartmentFormValues) => {
    if (!editingDepartment) return;
    
    updateDepartmentMutation.mutate({
      ...values,
      id: editingDepartment.id
    });
  };

  // 편집 모드 시작
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    editForm.reset({
      name: department.name,
      code: department.code,
      description: department.description || ''
    });
    setIsEditDialogOpen(true);
  };

  // 부서 삭제 확인
  const handleDelete = (departmentId: number) => {
    // 해당 부서에 속한 사용자가 있는지 확인
    const deptUsers = users.filter(u => u.department === departments.find(d => d.id === departmentId)?.name);
    
    if (deptUsers.length > 0) {
      toast({
        title: '부서 삭제 불가',
        description: `이 부서에는 ${deptUsers.length}명의 직원이 소속되어 있습니다. 직원을 먼저 다른 부서로 이동시켜 주세요.`,
        variant: 'destructive',
      });
      return;
    }
    
    if (window.confirm('정말로 이 부서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  // 필터링된 부서 목록
  const filteredDepartments = departments.filter(department => {
    if (!searchTerm) return true;
    
    return (
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // 부서별 직원 수 계산
  const getDepartmentUserCount = (departmentName: string) => {
    return users.filter(u => u.department === departmentName).length;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">부서 관리</h1>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="부서명 또는 코드로 검색"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                부서 추가
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 부서 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>부서 목록</CardTitle>
          <CardDescription>총 {filteredDepartments.length}개의 부서가 등록되어 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>부서명</TableHead>
                  <TableHead>부서 코드</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>소속 인원</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">로딩 중...</TableCell>
                  </TableRow>
                ) : filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {searchTerm
                        ? '검색 조건에 맞는 부서가 없습니다.'
                        : '등록된 부서가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{department.code}</TableCell>
                      <TableCell>{department.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{getDepartmentUserCount(department.name)}명</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(department)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(department.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 부서 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>부서 추가</DialogTitle>
            <DialogDescription>
              새로운 부서 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부서명</FormLabel>
                    <FormControl>
                      <Input placeholder="부서명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부서 코드</FormLabel>
                    <FormControl>
                      <Input placeholder="부서 코드" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명 (선택사항)</FormLabel>
                    <FormControl>
                      <Input placeholder="부서 설명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createDepartmentMutation.isPending}>부서 추가</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 부서 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>부서 정보 수정</DialogTitle>
            <DialogDescription>
              부서 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부서명</FormLabel>
                    <FormControl>
                      <Input placeholder="부서명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부서 코드</FormLabel>
                    <FormControl>
                      <Input placeholder="부서 코드" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명 (선택사항)</FormLabel>
                    <FormControl>
                      <Input placeholder="부서 설명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateDepartmentMutation.isPending}>정보 수정</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}