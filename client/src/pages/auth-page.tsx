import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Department, Position } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 로그인 폼 스키마
const loginSchema = z.object({
  username: z.string().min(1, { message: '아이디를 입력해주세요' }),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요' }),
});

// 회원가입 폼 스키마
const registerSchema = z.object({
  username: z.string().min(3, { message: '아이디는 최소 3자 이상이어야 합니다' }),
  password: z.string().min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다' }),
  confirmPassword: z.string().min(1, { message: '비밀번호 확인을 입력해주세요' }),
  name: z.string().min(1, { message: '이름을 입력해주세요' }),
  email: z.string().email({ message: '유효한 이메일을 입력해주세요' }),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // 부서 목록 가져오기
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    staleTime: 1000 * 60 * 5, // 5분 동안 데이터 유지
  });

  // 직급 목록 가져오기
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
    staleTime: 1000 * 60 * 5, // 5분 동안 데이터 유지
  });

  // 사용자가 이미 로그인한 경우 대시보드로 리디렉션
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // 로그인 폼
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // 회원가입 폼
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      department: '',
      position: '',
      phone: '',
    },
  });

  // 로그인 제출 핸들러
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // 회원가입 제출 핸들러
  const onRegisterSubmit = (data: RegisterFormValues) => {
    // confirmPassword 필드는 API에 보내지 않음
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // 전체 페이지가 로딩 중인 경우
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row justify-center items-center p-4 md:p-8">
      {/* 왼쪽: 인증 폼 */}
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="register">회원가입</TabsTrigger>
          </TabsList>
          
          {/* 로그인 탭 */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>로그인</CardTitle>
                <CardDescription>
                  사내 시스템에 접속하려면 계정으로 로그인하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>아이디</FormLabel>
                          <FormControl>
                            <Input placeholder="아이디를 입력하세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>비밀번호</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="비밀번호를 입력하세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {loginMutation.isError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {loginMutation.error?.message || '아이디 또는 비밀번호가 올바르지 않습니다.'}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      로그인
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  계정이 없으신가요? 
                  <button 
                    onClick={() => setActiveTab("register")}
                    className="text-primary hover:underline ml-1"
                  >
                    회원가입
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* 회원가입 탭 */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>회원가입</CardTitle>
                <CardDescription>
                  새로운 계정을 생성하여 사내 시스템을 이용하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>아이디 *</FormLabel>
                            <FormControl>
                              <Input placeholder="아이디를 입력하세요" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름 *</FormLabel>
                            <FormControl>
                              <Input placeholder="이름을 입력하세요" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이메일 *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="이메일을 입력하세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>비밀번호 *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="비밀번호를 입력하세요" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>비밀번호 확인 *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="비밀번호를 다시 입력하세요" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>부서</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="부서를 선택하세요" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.name}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>직급</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="직급을 선택하세요" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {positions.map((pos) => (
                                  <SelectItem key={pos.id} value={pos.name}>
                                    {pos.name}
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
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>연락처</FormLabel>
                          <FormControl>
                            <Input placeholder="연락처를 입력하세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {registerMutation.isError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {registerMutation.error?.message || '회원가입 처리 중 오류가 발생했습니다.'}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      회원가입
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  이미 계정이 있으신가요? 
                  <button 
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:underline ml-1"
                  >
                    로그인
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 오른쪽: 소개 섹션 (태블릿 이상 화면에서만 표시) */}
      <div className="hidden md:flex md:w-1/2 p-10 flex-col justify-center items-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">스마트 ERP 시스템</h1>
          <p className="text-lg text-gray-600 mb-6">
            기업 업무를 더욱 효율적으로 관리하세요. 전자결재, 인사관리, 업무일지 등 다양한 기능을 통합된 환경에서 이용할 수 있습니다.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mt-1 bg-primary-50 p-2 rounded-full">
                <Check className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-md font-medium text-gray-900">전자결재 시스템</h3>
                <p className="text-sm text-gray-600">간편한 문서 기안, 결재 처리 및 관리</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mt-1 bg-primary-50 p-2 rounded-full">
                <Check className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-md font-medium text-gray-900">인사관리 시스템</h3>
                <p className="text-sm text-gray-600">직원, 부서, 근태, 급여 관리를 한 곳에서</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mt-1 bg-primary-50 p-2 rounded-full">
                <Check className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-md font-medium text-gray-900">업무일지 시스템</h3>
                <p className="text-sm text-gray-600">일일 업무 기록 및 효율적인 업무 관리</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
