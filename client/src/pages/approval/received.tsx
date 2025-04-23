import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Approval } from '@shared/schema';

type ApprovalStatus = '기안됨' | '결재중' | '승인됨' | '반려됨' | '회수됨';

export default function ApprovalReceived() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('대기');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 결재 대기 문서 목록 조회
  const { data: approvals = [], isLoading, refetch } = useQuery<Approval[]>({
    queryKey: ['/api/approvals', { isCreator: false }],
    enabled: !!user,
  });
  
  // 사용자 목록 조회 (기안자 이름 표시를 위해)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user,
  });
  
  // 결재자 정보 가져오기
  const getApproverInfo = (userId: number) => {
    const approver = users.find((u: any) => u.id === userId);
    return approver ? {
      name: approver.name,
      department: approver.department,
      position: approver.position
    } : { name: '알 수 없음', department: '', position: '' };
  };

  // 필터링된 목록
  const filteredApprovals = approvals.filter(approval => {
    let matchesSearch = true;
    let matchesStatus = true;
    let matchesType = true;

    if (searchTerm) {
      matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      approval.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    }

    if (selectedStatus && selectedStatus !== 'all') {
      matchesStatus = approval.status === selectedStatus;
    }

    if (selectedType && selectedType !== 'all') {
      matchesType = approval.type === selectedType;
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredApprovals.length / itemsPerPage);
  const currentItems = filteredApprovals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 상태에 따른 배지 스타일
  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case '기안됨':
        return <Badge variant="outline">기안됨</Badge>;
      case '결재중':
        return <Badge variant="warning">결재중</Badge>;
      case '승인됨':
        return <Badge variant="success">승인됨</Badge>;
      case '반려됨':
        return <Badge variant="destructive">반려됨</Badge>;
      case '회수됨':
        return <Badge variant="secondary">회수됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 우선순위에 따른 배지 스타일
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case '일반':
        return <Badge variant="outline">일반</Badge>;
      case '중요':
        return <Badge variant="warning">중요</Badge>;
      case '긴급':
        return <Badge variant="destructive">긴급</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };
  
  // 내 결재 상태 표시 (이 부분은 실제로는 결재선 정보를 API에서 가져와서 처리해야 함)
  const getMyApprovalStatus = (approvalId: number) => {
    return <Badge variant="outline">대기중</Badge>;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">결재 요청 문서</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="제목 또는 문서번호 검색"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="대기">대기</SelectItem>
                  <SelectItem value="승인">승인 완료</SelectItem>
                  <SelectItem value="반려">반려 완료</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType || ''} onValueChange={(value) => setSelectedType(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="종류 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 종류</SelectItem>
                  <SelectItem value="일반기안">일반기안</SelectItem>
                  <SelectItem value="지출결의서">지출결의서</SelectItem>
                  <SelectItem value="휴가신청서">휴가신청서</SelectItem>
                  <SelectItem value="출장신청서">출장신청서</SelectItem>
                  <SelectItem value="구매요청서">구매요청서</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-blue-100 p-2 mr-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">대기 문서</div>
              <div className="text-2xl font-bold text-gray-800">
                {approvals.filter(a => a.status === '대기').length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-green-100 p-2 mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">승인 문서</div>
              <div className="text-2xl font-bold text-gray-800">
                {approvals.filter(a => a.status === '승인').length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-red-100 p-2 mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">반려 문서</div>
              <div className="text-2xl font-bold text-gray-800">
                {approvals.filter(a => a.status === '반려').length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg font-semibold">결재 요청 문서</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문서번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종류</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기안자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요도</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기안일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문서 상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내 결재 상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || (selectedStatus && selectedStatus !== 'all') || (selectedType && selectedType !== 'all')
                        ? '검색 조건에 맞는 결재 문서가 없습니다.'
                        : '결재할 문서가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/approval/${approval.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.documentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {approval.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getApproverInfo(approval.userId)?.name || '알 수 없음'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(approval.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(approval.createdAt), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(approval.status as ApprovalStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getMyApprovalStatus(approval.id)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
              <div className="text-sm text-gray-500">
                총 {filteredApprovals.length}개 중 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredApprovals.length)}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}