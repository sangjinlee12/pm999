import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Settings, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [colorTheme, setColorTheme] = useState<string>("blue");

  // 컴포넌트가 마운트된 후에만 테마 관련 UI를 렌더링
  useEffect(() => {
    setMounted(true);
    
    // 초기 컬러 테마 클래스 설정
    const savedColorTheme = localStorage.getItem("color-theme") || "blue";
    setColorTheme(savedColorTheme);
    document.documentElement.classList.add(`theme-${savedColorTheme}`);
  }, []);

  // 컬러 테마 변경 함수
  const changeColorTheme = (newTheme: string) => {
    // 기존 테마 클래스 제거
    document.documentElement.classList.remove("theme-blue", "theme-red", "theme-green");
    
    // 새 테마 클래스 추가
    document.documentElement.classList.add(`theme-${newTheme}`);
    
    // 로컬 스토리지에 저장
    localStorage.setItem("color-theme", newTheme);
    
    // 상태 업데이트
    setColorTheme(newTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shadow-none">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">설정</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] shadow-elevation-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground">디스플레이</DropdownMenuLabel>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4 text-amber-500" />
          <span>라이트 모드</span>
          {theme === "light" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4 text-blue-500" />
          <span>다크 모드</span>
          {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("system")}>
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-foreground"></span>
          </span>
          <span>시스템 기본값</span>
          {theme === "system" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">색상 테마</DropdownMenuLabel>
        <DropdownMenuItem className="gap-2" onClick={() => changeColorTheme("blue")}>
          <Circle className="h-4 w-4 fill-blue-500 text-blue-500" />
          <span>Google Blue</span>
          {colorTheme === "blue" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => changeColorTheme("red")}>
          <Circle className="h-4 w-4 fill-red-500 text-red-500" />
          <span>Google Red</span>
          {colorTheme === "red" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => changeColorTheme("green")}>
          <Circle className="h-4 w-4 fill-green-600 text-green-600" />
          <span>Google Green</span>
          {colorTheme === "green" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}