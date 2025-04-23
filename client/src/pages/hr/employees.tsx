import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, Plus, Pencil, UserPlus, UserX, RefreshCw } from "lucide-react";

// 사용자 타입 정의
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  departmentId?: number;
  departmentName?: string;
  positionId?: number;
  positionName?: string;
  isAdmin?: boolean;
  status?: string;
  hireDate?: string;
  avatar?: string;
}

export default function EmployeesManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 사용자 목록 조회
  const { 
    data: users = [], 
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('사용자 목록을 불러올 수 없습니다.');
      return res.json();
    }
  });

  // 부서 목록 조회
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('부서 목록을 불러올 수 없습니다.');
      return res.json();
    }
  });

  // 직급 목록 조회
  const { data: positions = [] } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async () => {
      const res = await fetch('/api/positions');
      if (!res.ok) throw new Error('직급 목록을 불러올 수 없습니다.');
      return res.json();
    }
  });

  // 사용자 계정 비활성화
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/users/${userId}`, 
        { status: "inactive" }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "계정 비활성화", 
        description: "사용자 계정이 비활성화되었습니다." 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "오류 발생", 
        description: error.message || "계정 비활성화 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    // 검색어 필터링
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 부서 필터링
    const matchesDepartment = 
      departmentFilter === "all" || 
      user.departmentId?.toString() === departmentFilter;
    
    // 직급 필터링
    const matchesPosition = 
      positionFilter === "all" || 
      user.positionId?.toString() === positionFilter;
    
    return matchesSearch && matchesDepartment && matchesPosition;
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6 text-center">
        <p className="text-red-500 mb-2">오류가 발생했습니다.</p>
        <p className="text-sm text-gray-500">{error instanceof Error ? error.message : "알 수 없는 오류"}</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">직원 관리</h1>
        {user?.isAdmin && (
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            직원 추가
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>직원 검색 및 필터</CardTitle>
          <CardDescription>이름, 이메일, 전화번호 또는 사용자 ID로 검색하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="검색어 입력..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 부서</SelectItem>
                {departments.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="직급 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 직급</SelectItem>
                {positions.map((pos: any) => (
                  <SelectItem key={pos.id} value={pos.id.toString()}>
                    {pos.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableCaption>
              {filteredUsers.length > 0 
                ? `총 ${filteredUsers.length}명의 직원` 
                : "검색 결과가 없습니다."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        {user.name}
                        {user.isAdmin && (
                          <Badge variant="outline" className="ml-2 text-xs">관리자</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.departmentName || "-"}</TableCell>
                  <TableCell>{user.positionName || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    {user.status === "active" ? (
                      <Badge variant="success">재직중</Badge>
                    ) : user.status === "inactive" ? (
                      <Badge variant="secondary">비활성</Badge>
                    ) : (
                      <Badge variant="outline">확인중</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user?.isAdmin && (
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleUserSelect(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.id !== Number(user?.id) && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deactivateUserMutation.mutate(user.id)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 사용자 추가 다이얼로그 - 실제 구현은 추후 진행 */}
      <Dialog 
        open={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>직원 추가</DialogTitle>
            <DialogDescription>
              새로운 직원 정보를 입력하여 사용자 계정을 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground">
            직원 추가 기능은 추후 구현될 예정입니다.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              취소
            </Button>
            <Button disabled>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 사용자 편집 다이얼로그 - 실제 구현은 추후 진행 */}
      <Dialog 
        open={!!selectedUser} 
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>직원 정보 수정</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} 직원의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground">
            직원 정보 수정 기능은 추후 구현될 예정입니다.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              취소
            </Button>
            <Button disabled>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}