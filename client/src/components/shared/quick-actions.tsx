import { useState } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  Calendar,
  PenLine,
  FileSignature,
  Clock,
  X,
  Plus,
  BookOpen,
  ListChecks,
  MoreHorizontal
} from 'lucide-react';

export default function QuickActions() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();

  if (!user) return null;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (action: string) => {
    setIsOpen(false);
    
    switch (action) {
      case 'approval':
        navigate('/approval/create');
        break;
      case 'worklog':
        navigate('/worklog/daily');
        break;
      case 'weeklyPlan':
        navigate('/worklog/weekly');
        break;
      case 'attendance':
        navigate('/hr/attendance');
        break;
      default:
        break;
    }
  };

  const quickActions = [
    {
      id: 'approval',
      title: '결재 문서 작성',
      icon: <FileSignature className="h-5 w-5" />,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'worklog',
      title: '업무일지 작성',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'weeklyPlan',
      title: '주간 계획 작성',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'attendance',
      title: '출퇴근 등록',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end">
            {quickActions.map((action) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className="flex items-center gap-2"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="default"
                        className={`rounded-full ${action.color} shadow-lg`}
                        onClick={() => handleAction(action.id)}
                      >
                        {action.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{action.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className={`rounded-full shadow-lg ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-45 transition-transform'
            : 'bg-primary hover:bg-primary/90'
        }`}
        onClick={toggleOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
  );
}