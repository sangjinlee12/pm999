import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

export default function NotificationSettings() {
  const { user } = useAuth();
  
  // 알림 설정 상태
  const [settings, setSettings] = useState({
    email: {
      approvals: true,
      comments: true,
      workLogs: true,
      schedules: false
    },
    inApp: {
      approvals: true,
      comments: true,
      workLogs: true,
      schedules: true,
      directMessages: true
    },
    frequency: "immediate" // immediate, daily, weekly
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      // 실제 API가 구현되면 연결
      const response = await apiRequest("POST", `/api/users/${user?.id}/notification-settings`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "설정 업데이트",
        description: "알림 설정이 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류 발생",
        description: error.message || "설정 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (category: 'email' | 'inApp', type: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value
      }
    }));
  };
  
  const handleFrequencyChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      frequency: value
    }));
  };
  
  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">알림 설정</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>이메일 알림</CardTitle>
            <CardDescription>
              이메일로 수신할 알림을 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-approvals" className="font-medium">결재 알림</Label>
                <p className="text-sm text-muted-foreground">
                  새 결재 요청, 결재 승인/반려 알림
                </p>
              </div>
              <Switch
                id="email-approvals"
                checked={settings.email.approvals}
                onCheckedChange={(value) => handleChange('email', 'approvals', value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-comments" className="font-medium">댓글 알림</Label>
                <p className="text-sm text-muted-foreground">
                  업무 문서나 결재 문서에 새 댓글이 작성될 때 알림
                </p>
              </div>
              <Switch
                id="email-comments"
                checked={settings.email.comments}
                onCheckedChange={(value) => handleChange('email', 'comments', value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-worklogs" className="font-medium">업무일지 알림</Label>
                <p className="text-sm text-muted-foreground">
                  업무일지 피드백, 주간 계획 리마인더
                </p>
              </div>
              <Switch
                id="email-worklogs"
                checked={settings.email.workLogs}
                onCheckedChange={(value) => handleChange('email', 'workLogs', value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-schedules" className="font-medium">일정 알림</Label>
                <p className="text-sm text-muted-foreground">
                  회의, 이벤트, 기타 일정 리마인더
                </p>
              </div>
              <Switch
                id="email-schedules"
                checked={settings.email.schedules}
                onCheckedChange={(value) => handleChange('email', 'schedules', value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>앱 내 알림</CardTitle>
            <CardDescription>
              앱 내에서 표시할 알림을 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-approvals" className="font-medium">결재 알림</Label>
                <p className="text-sm text-muted-foreground">
                  새 결재 요청, 결재 승인/반려 알림
                </p>
              </div>
              <Switch
                id="inapp-approvals"
                checked={settings.inApp.approvals}
                onCheckedChange={(value) => handleChange('inApp', 'approvals', value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-comments" className="font-medium">댓글 알림</Label>
                <p className="text-sm text-muted-foreground">
                  업무 문서나 결재 문서에 새 댓글이 작성될 때 알림
                </p>
              </div>
              <Switch
                id="inapp-comments"
                checked={settings.inApp.comments}
                onCheckedChange={(value) => handleChange('inApp', 'comments', value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-worklogs" className="font-medium">업무일지 알림</Label>
                <p className="text-sm text-muted-foreground">
                  업무일지 피드백, 주간 계획 리마인더
                </p>
              </div>
              <Switch
                id="inapp-worklogs"
                checked={settings.inApp.workLogs}
                onCheckedChange={(value) => handleChange('inApp', 'workLogs', value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-schedules" className="font-medium">일정 알림</Label>
                <p className="text-sm text-muted-foreground">
                  회의, 이벤트, 기타 일정 리마인더
                </p>
              </div>
              <Switch
                id="inapp-schedules"
                checked={settings.inApp.schedules}
                onCheckedChange={(value) => handleChange('inApp', 'schedules', value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-directmessages" className="font-medium">메시지 알림</Label>
                <p className="text-sm text-muted-foreground">
                  새로운 직접 메시지 수신 시 알림
                </p>
              </div>
              <Switch
                id="inapp-directmessages"
                checked={settings.inApp.directMessages}
                onCheckedChange={(value) => handleChange('inApp', 'directMessages', value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>알림 빈도</CardTitle>
            <CardDescription>
              알림을 받는 빈도를 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={settings.frequency} 
              onValueChange={handleFrequencyChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate" className="font-medium">실시간</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6 -mt-2">
                발생 즉시 모든 알림을 받습니다.
              </p>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-medium">일간 요약</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6 -mt-2">
                매일 오전 9시에 전날의 알림을 요약하여 받습니다.
              </p>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-medium">주간 요약</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6 -mt-2">
                매주 월요일 오전에 지난 주의 알림을 요약하여 받습니다.
              </p>
            </RadioGroup>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "설정 저장"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}