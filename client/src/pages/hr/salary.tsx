import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Loader2, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  MoreHorizontal,
  FileText,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 급여 데이터 타입 정의
interface SalaryRecord {
  id: number;
  userId: number;
  userName: string;
  departmentName?: string;
  positionName?: string;
  year: number;
  month: number;
  basicSalary: number;
  bonus?: number;
  overtimePay?: number;
  deductions?: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
}

// 급여 데이터 (샘플 데이터)
const sampleSalaryData: SalaryRecord[] = [
  {
    id: 1,
    userId: 1,
    userName: "관리자",
    departmentName: "경영지원부",
    positionName: "부장",
    year: 2025,
    month: 3,
    basicSalary: 5000000,
    bonus: 500000,
    overtimePay: 200000,
    deductions: 700000,
    netSalary: 5000000,
    status: 'paid',
    paymentDate: '2025-03-10'
  },
  {
    id: 2,
    userId: 2,
    userName: "홍길동",
    departmentName: "개발팀",
    positionName: "차장",
    year: 2025,
    month: 3,
    basicSalary: 4500000,
    bonus: 300000,
    overtimePay: 150000,
    deductions: 650000,
    netSalary: 4300000,
    status: 'paid',
    paymentDate: '2025-03-10'
  },
  {
    id: 3,
    userId: 3,
    userName: "김철수",
    departmentName: "마케팅",
    positionName: "과장",
    year: 2025,
    month: 3,
    basicSalary: 3500000,
    bonus: 200000,
    overtimePay: 100000,
    deductions: 500000,
    netSalary: 3300000,
    status: 'paid',
    paymentDate: '2025-03-10'
  },
  {
    id: 4,
    userId: 4,
    userName: "이영희",
    departmentName: "인사팀",
    positionName: "대리",
    year: 2025,
    month: 3,
    basicSalary: 3000000,
    bonus: 100000,
    overtimePay: 50000,
    deductions: 400000,
    netSalary: 2750000,
    status: 'paid',
    paymentDate: '2025-03-10'
  },
  {
    id: 5,
    userId: 5,
    userName: "박지민",
    departmentName: "개발팀",
    positionName: "사원",
    year: 2025,
    month: 3,
    basicSalary: 2800000,
    bonus: 0,
    overtimePay: 120000,
    deductions: 380000,
    netSalary: 2540000,
    status: 'paid',
    paymentDate: '2025-03-10'
  },
  {
    id: 6,
    userId: 1,
    userName: "관리자",
    departmentName: "경영지원부",
    positionName: "부장",
    year: 2025,
    month: 4,
    basicSalary: 5000000,
    bonus: 0,
    overtimePay: 150000,
    deductions: 700000,
    netSalary: 4450000,
    status: 'approved',
    paymentDate: '2025-04-10'
  },
  {
    id: 7,
    userId: 2,
    userName: "홍길동",
    departmentName: "개발팀",
    positionName: "차장",
    year: 2025,
    month: 4,
    basicSalary: 4500000,
    bonus: 0,
    overtimePay: 180000,
    deductions: 650000,
    netSalary: 4030000,
    status: 'approved',
    paymentDate: '2025-04-10'
  },
  {
    id: 8,
    userId: 3,
    userName: "김철수",
    departmentName: "마케팅",
    positionName: "과장",
    year: 2025,
    month: 4,
    basicSalary: 3500000,
    bonus: 0,
    overtimePay: 80000,
    deductions: 500000,
    netSalary: 3080000,
    status: 'approved',
    paymentDate: '2025-04-10'
  }
];

export default function SalaryManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("2025");
  const [monthFilter, setMonthFilter] = useState("all");
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // 사용자가 관리자인지 확인
  const isAdmin = user?.isAdmin;
  
  // 전체 급여 내역 내보내기 함수
  const exportAllSalaryData = () => {
    try {
      const doc = new jsPDF();
      
      // 헤더 추가
      doc.setFontSize(18);
      doc.text("급여 내역 보고서", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text(`생성일: ${format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}`, 105, 25, { align: "center" });
      
      if (departmentFilter !== "all" || yearFilter !== "all" || monthFilter !== "all") {
        let filterText = "필터: ";
        if (departmentFilter !== "all") filterText += `부서(${departmentFilter}) `;
        if (yearFilter !== "all") filterText += `연도(${yearFilter}년) `;
        if (monthFilter !== "all") filterText += `월(${monthFilter}월) `;
        doc.setFontSize(10);
        doc.text(filterText, 105, 35, { align: "center" });
      }
      
      // 테이블 데이터 준비
      const tableColumn = ["직원명", "부서", "직급", "지급 연월", "기본급", "보너스", "공제액", "실지급액", "상태"];
      const tableRows = filteredSalaryData.map(salary => [
        salary.userName,
        salary.departmentName || "",
        salary.positionName || "",
        `${salary.year}년 ${salary.month}월`,
        `${salary.basicSalary.toLocaleString()}원`,
        `${(salary.bonus || 0).toLocaleString()}원`,
        `${(salary.deductions || 0).toLocaleString()}원`,
        `${salary.netSalary.toLocaleString()}원`,
        salary.status === "paid" ? "지급완료" : salary.status === "approved" ? "승인됨" : "작성중"
      ]);
      
      // 테이블 생성
      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: { 
          4: { halign: 'right' }, 
          5: { halign: 'right' }, 
          6: { halign: 'right' }, 
          7: { halign: 'right' } 
        }
      });
      
      // 푸터 추가
      const pageCount = (doc as any).internal.pages ? (doc as any).internal.pages.length - 1 : 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`페이지 ${i} / ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }
      
      // PDF 파일 다운로드
      doc.save(`급여내역_${format(new Date(), 'yyyy_MM_dd', { locale: ko })}.pdf`);
    } catch (error) {
      console.error("PDF 생성 중 오류가 발생했습니다:", error);
      alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };
  
  // 개별 급여 명세서 PDF 다운로드 함수
  const downloadSalaryPDF = (salary: SalaryRecord) => {
    try {
      // PDF 생성
      const doc = new jsPDF();
      
      // 회사 로고 및 헤더 추가
      doc.setFontSize(20);
      doc.text("급여 명세서", 105, 15, { align: "center" });
      
      // 직원 정보 추가
      doc.setFontSize(12);
      doc.text(`직원명: ${salary.userName}`, 14, 30);
      doc.text(`부서: ${salary.departmentName || ""}`, 14, 37);
      doc.text(`직급: ${salary.positionName || ""}`, 14, 44);
      doc.text(`지급 연월: ${salary.year}년 ${salary.month}월`, 14, 51);
      
      if (salary.paymentDate) {
        const paymentDate = new Date(salary.paymentDate);
        doc.text(`지급일: ${format(paymentDate, 'yyyy년 MM월 dd일', { locale: ko })}`, 14, 58);
      }
      
      // 급여 상세 내역 테이블
      const tableData = [
        ["항목", "금액"],
        ["기본급", `${salary.basicSalary.toLocaleString()}원`],
        ["상여금", `${(salary.bonus || 0).toLocaleString()}원`],
        ["초과근무수당", `${(salary.overtimePay || 0).toLocaleString()}원`],
        ["총 지급액", `${(salary.basicSalary + (salary.bonus || 0) + (salary.overtimePay || 0)).toLocaleString()}원`],
        ["공제액", `${(salary.deductions || 0).toLocaleString()}원`],
        ["실 지급액", `${salary.netSalary.toLocaleString()}원`]
      ];
      
      autoTable(doc, {
        startY: 65,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // 푸터 추가
      // 페이지 수 구하기 (jsPDF v2 이상에서는 다르게 접근)
      const pageCount = (doc as any).internal.pages ? (doc as any).internal.pages.length - 1 : 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`생성일: ${format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`페이지 ${i} / ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }
      
      // PDF 파일 다운로드
      doc.save(`급여명세서_${salary.userName}_${salary.year}년${salary.month}월.pdf`);
    } catch (error) {
      console.error("PDF 생성 중 오류가 발생했습니다:", error);
      alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 부서 목록 조회
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('부서 목록을 불러올 수 없습니다.');
      return res.json();
    }
  });

  // 실제 구현 시에는 API 호출로 대체
  // const { data: salaryData = [], isLoading } = useQuery({ ... });
  const isLoading = false;
  const salaryData = sampleSalaryData;

  // 필터링된 급여 데이터
  const filteredSalaryData = salaryData.filter(salary => {
    // 검색어 필터링
    const matchesSearch = 
      salary.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (salary.departmentName && salary.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 부서 필터링
    const matchesDepartment = 
      departmentFilter === "all" ||
      (salary.departmentName && salary.departmentName === departmentFilter);
    
    // 연도 필터링
    const matchesYear = 
      yearFilter === "all" ||
      salary.year.toString() === yearFilter;
    
    // 월 필터링
    const matchesMonth = 
      monthFilter === "all" ||
      salary.month.toString() === monthFilter;
    
    // 상태 필터링
    const matchesStatus = 
      activeTab === "all" ||
      (activeTab === "draft" && salary.status === "draft") ||
      (activeTab === "approved" && salary.status === "approved") ||
      (activeTab === "paid" && salary.status === "paid");
    
    return matchesSearch && matchesDepartment && matchesYear && matchesMonth && matchesStatus;
  });

  // 접근 권한 확인
  if (!isAdmin) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>접근 제한</CardTitle>
            <CardDescription>
              급여 관리 페이지에 접근할 권한이 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground">이 페이지는 관리자만 접근할 수 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">급여 관리</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            급여 데이터 업로드
          </Button>
          <Button variant="outline" onClick={exportAllSalaryData}>
            <Download className="mr-2 h-4 w-4" />
            급여 내역 내보내기
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="draft">작성중</TabsTrigger>
          <TabsTrigger value="approved">승인됨</TabsTrigger>
          <TabsTrigger value="paid">지급완료</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>급여 내역 검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="직원 이름 또는 부서 검색..."
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
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 연도</SelectItem>
                <SelectItem value="2024">2024년</SelectItem>
                <SelectItem value="2025">2025년</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="월 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 월</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}월
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
              {filteredSalaryData.length > 0 
                ? `총 ${filteredSalaryData.length}개의 급여 내역` 
                : "검색 결과가 없습니다."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>직원 이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>지급 연월</TableHead>
                <TableHead className="text-right">기본급</TableHead>
                <TableHead className="text-right">보너스</TableHead>
                <TableHead className="text-right">공제액</TableHead>
                <TableHead className="text-right">실지급액</TableHead>
                <TableHead>지급 상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSalaryData.map((salary) => (
                <TableRow key={salary.id}>
                  <TableCell className="font-medium">{salary.userName}</TableCell>
                  <TableCell>{salary.departmentName}</TableCell>
                  <TableCell>{salary.positionName}</TableCell>
                  <TableCell>{salary.year}년 {salary.month}월</TableCell>
                  <TableCell className="text-right">
                    {salary.basicSalary.toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-right">
                    {(salary.bonus || 0).toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-right">
                    {(salary.deductions || 0).toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {salary.netSalary.toLocaleString()}원
                  </TableCell>
                  <TableCell>
                    {salary.status === "paid" ? (
                      <Badge variant="success">지급완료</Badge>
                    ) : salary.status === "approved" ? (
                      <Badge variant="outline">승인됨</Badge>
                    ) : (
                      <Badge variant="secondary">작성중</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedSalary(salary)}>
                          <FileText className="mr-2 h-4 w-4" />
                          상세 내역 보기
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          명세서 이메일 발송
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 급여 상세 다이얼로그 */}
      <Dialog 
        open={!!selectedSalary} 
        onOpenChange={(open) => !open && setSelectedSalary(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>급여 상세 내역</DialogTitle>
            <DialogDescription>
              {selectedSalary?.userName}님의 {selectedSalary?.year}년 {selectedSalary?.month}월 급여 상세 내역입니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSalary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">지급 일자</h3>
                  <p>
                    {selectedSalary.paymentDate ? 
                      format(new Date(selectedSalary.paymentDate), 'yyyy년 MM월 dd일', { locale: ko }) : 
                      '미정'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">지급 상태</h3>
                  <p>
                    {selectedSalary.status === "paid" ? "지급완료" : 
                      selectedSalary.status === "approved" ? "승인됨" : "작성중"}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">지급 내역</h3>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">기본급</span>
                  <span>{selectedSalary.basicSalary.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상여금</span>
                  <span>{(selectedSalary.bonus || 0).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">초과근무수당</span>
                  <span>{(selectedSalary.overtimePay || 0).toLocaleString()}원</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>총 지급액</span>
                  <span>
                    {(
                      selectedSalary.basicSalary + 
                      (selectedSalary.bonus || 0) + 
                      (selectedSalary.overtimePay || 0)
                    ).toLocaleString()}원
                  </span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">공제 내역</h3>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">소득세</span>
                  <span>{Math.floor((selectedSalary.deductions || 0) * 0.4).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">국민연금</span>
                  <span>{Math.floor((selectedSalary.deductions || 0) * 0.3).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">건강보험</span>
                  <span>{Math.floor((selectedSalary.deductions || 0) * 0.2).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">고용보험</span>
                  <span>{Math.floor((selectedSalary.deductions || 0) * 0.1).toLocaleString()}원</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>총 공제액</span>
                  <span>{(selectedSalary.deductions || 0).toLocaleString()}원</span>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between font-bold text-lg">
                  <span>실수령액</span>
                  <span>{selectedSalary.netSalary.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSalary(null)}>
              닫기
            </Button>
            <Button onClick={() => selectedSalary && downloadSalaryPDF(selectedSalary)}>
              <Download className="mr-2 h-4 w-4" />
              PDF 다운로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}