import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Clock, 
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  Undo
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Approval, ApprovalLine } from '@shared/schema';

type ApprovalStatus = '기안됨' | '결재중' | '승인됨' | '반려됨' | '회수됨';
type ApprovalLineStatus = '대기' | '승인' | '반려';

interface ApprovalDetail extends Approval {
  approvalLines?: ApprovalLine[];
}

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // 결재 문서 상세 정보 조회
  const { data: approval, isLoading, refetch } = useQuery<ApprovalDetail>({
    queryKey: ['/api/approvals', Number(id)],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/approvals/${id}`);
      return await res.json();
    },
    enabled: !!id && !!user,
  });

  // 사용자 목록 조회 (결재선에 이름 표시를 위해)
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

  // 현재 사용자가 결재 가능한지 확인
  const currentUserApprovalLine = approval?.approvalLines?.find(line => 
    line.userId === user?.id && line.status === '대기');

  // 이전 결재자들이 모두 승인했는지 확인
  const canApprove = () => {
    if (!currentUserApprovalLine || !approval?.approvalLines) return false;
    
    const previousLines = approval.approvalLines.filter(
      line => line.order < currentUserApprovalLine.order
    );
    
    return previousLines.every(line => line.status === '승인');
  };

  // 결재 승인 뮤테이션
  const approvalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/approvals/${id}/process`, {
        status: '승인',
        comment: comment
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '결재 승인 완료',
        description: '문서가 성공적으로 승인되었습니다.',
      });
      refetch();
      queryClient.invalidateQueries({queryKey: ['/api/approvals']});
    },
    onError: (error: Error) => {
      toast({
        title: '결재 승인 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 결재 반려 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/approvals/${id}/process`, {
        status: '반려',
        comment: rejectReason
      });
      return await res.json();
    },
    onSuccess: () => {
      setShowRejectDialog(false);
      toast({
        title: '결재 반려 완료',
        description: '문서가 반려되었습니다.',
      });
      refetch();
      queryClient.invalidateQueries({queryKey: ['/api/approvals']});
    },
    onError: (error: Error) => {
      toast({
        title: '결재 반려 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 문서 회수 뮤테이션 (기안자만 가능)
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/approvals/${id}/withdraw`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: '문서 회수 완료',
        description: '문서가 회수되었습니다.',
      });
      refetch();
      queryClient.invalidateQueries({queryKey: ['/api/approvals']});
    },
    onError: (error: Error) => {
      toast({
        title: '문서 회수 실패',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 결재 승인 처리
  const handleApprove = () => {
    if (!canApprove()) {
      toast({
        title: '결재 불가',
        description: '이전 결재자의 승인이 필요합니다.',
        variant: 'destructive',
      });
      return;
    }
    approvalMutation.mutate();
  };

  // 결재 반려 처리
  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast({
        title: '반려 사유 필요',
        description: '반려 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    rejectMutation.mutate();
  };

  // 문서 회수 처리
  const handleWithdraw = () => {
    if (window.confirm('문서를 회수하시겠습니까?')) {
      withdrawMutation.mutate();
    }
  };

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

  // 결재선 상태에 따른 배지 스타일
  const getApprovalLineBadge = (status: ApprovalLineStatus) => {
    switch (status) {
      case '대기':
        return <Badge variant="outline">대기</Badge>;
      case '승인':
        return <Badge variant="success">승인</Badge>;
      case '반려':
        return <Badge variant="destructive">반려</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  if (!approval) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg font-medium mb-2">문서를 찾을 수 없습니다.</div>
        <Button variant="outline" onClick={() => navigate('/approval/list')}>목록으로 돌아가기</Button>
      </div>
    );
  }

  // 현재 사용자가 기안자인지 확인
  const isCreator = approval.userId === user?.id;

  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/approval/list')}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          목록
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">{approval.title}</h1>
        <div className="ml-auto">
          {getStatusBadge(approval.status as ApprovalStatus)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>문서 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">문서 번호</div>
                <div>{approval.documentNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">문서 종류</div>
                <div>{approval.type}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">기안자</div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {getApproverInfo(approval.userId).name} ({getApproverInfo(approval.userId).department}/{getApproverInfo(approval.userId).position})
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">기안일</div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {format(new Date(approval.createdAt), 'yyyy년 MM월 dd일')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">중요도</div>
                <div>
                  <Badge className={`
                    ${approval.priority === '긴급' ? 'bg-red-100 text-red-800' : 
                     approval.priority === '중요' ? 'bg-amber-100 text-amber-800' : 
                     'bg-blue-100 text-blue-800'}
                  `}>
                    {approval.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">처리 상태</div>
                <div>
                  {getStatusBadge(approval.status as ApprovalStatus)}
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <div className="text-sm font-medium text-gray-500 mb-2">제목</div>
              <div className="text-lg font-medium pb-2 border-b">{approval.title}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">내용</div>
              <div className="bg-gray-50 p-4 rounded-md min-h-[300px] whitespace-pre-wrap">
                {approval.content}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>결재선</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approval.approvalLines?.sort((a: any, b: any) => a.order - b.order).map((line: any) => {
                const approverInfo = getApproverInfo(line.userId);
                return (
                  <div key={line.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback>
                          {approverInfo.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{approverInfo.name}</div>
                        <div className="text-xs text-gray-500">
                          {approverInfo.department} / {approverInfo.position}
                        </div>
                        {line.approvedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(line.approvedAt), 'yyyy-MM-dd HH:mm')}
                          </div>
                        )}
                        {line.comment && (
                          <div className="text-xs text-gray-600 mt-1 bg-white p-1 rounded">
                            {line.comment}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge className="mb-1">{line.order}차</Badge>
                      {getApprovalLineBadge(line.status as ApprovalLineStatus)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 결재 또는 반려 액션 영역 */}
            {currentUserApprovalLine && (
              <div className="mt-6 border-t pt-4">
                <div className="text-sm font-medium text-gray-500 mb-2">의견</div>
                <Textarea
                  placeholder="결재 의견을 입력하세요"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    반려
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleApprove}
                    disabled={!canApprove() || approvalMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    승인
                  </Button>
                </div>
              </div>
            )}

            {/* 문서 회수 버튼 (기안자이고, 아직 처리 중인 경우만) */}
            {isCreator && ['기안됨', '결재중'].includes(approval.status) && (
              <div className="mt-6 pt-4 border-t">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                >
                  <Undo className="h-4 w-4 mr-2" />
                  문서 회수
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 반려 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 반려</DialogTitle>
            <DialogDescription>
              반려 사유를 작성해주세요. 작성자에게 알림이 전송됩니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="반려 사유를 입력하세요"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)}
            >
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              반려하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}