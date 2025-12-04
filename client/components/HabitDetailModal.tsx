
import React, { useState, useEffect } from 'react';
import type { Habit, Day, HabitRecord } from '../types';
import { supabase } from '../lib/supabase';

interface HabitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
  onEdit: () => void;
}

const HabitDetailModal: React.FC<HabitDetailModalProps> = ({ isOpen, onClose, habit, onEdit }) => {
  const [history, setHistory] = useState<HabitRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const days: Day[] = ['월', '화', '수', '목', '금', '토', '일'];

  useEffect(() => {
    if (isOpen) {
        setIsHistoryOpen(false); // Reset on open
        setHistory([]);
    }
  }, [isOpen]);

  const toggleHistory = async () => {
    if (!isHistoryOpen) {
        setIsHistoryOpen(true);
        if (habit && history.length === 0) {
            setLoadingHistory(true);
            const { data, error } = await supabase
                .from('habitRecords')
                .select('*')
                .eq('habit_id', habit.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (!error && data) {
                setHistory(data);
            }
            setLoadingHistory(false);
        }
    } else {
        setIsHistoryOpen(false);
    }
  };

  if (!isOpen || !habit) return null;

  // Calculate status display
  const getStatusDisplay = () => {
    if (!habit.activate) return { text: '비활성화됨', color: 'bg-gray-100 text-gray-500', icon: 'fa-pause' };
    
    // Check if today is scheduled
    const today = new Date();
    const dayIndex = today.getDay();
    const kDays: Day[] = ['일', '월', '화', '수', '목', '금', '토'];
    const todayChar = kDays[dayIndex];
    const isScheduledToday = habit.days.includes(todayChar);

    if (!isScheduledToday) return { text: '오늘은 휴식일', color: 'bg-blue-50 text-blue-500', icon: 'fa-mug-hot' };
    
    // Logic for today's status
    const todayCount = habit.todayRecords ? habit.todayRecords.length : 0;
    const totalSlots = habit.time.length;

    if (totalSlots === 0) {
        // No specific time
        if (todayCount > 0) return { text: '오늘 완료', color: 'bg-green-100 text-green-600', icon: 'fa-check' };
        return { text: '미완료', color: 'bg-gray-100 text-gray-600', icon: 'fa-hourglass-start' };
    }

    // Time slots exist
    if (todayCount === 0) return { text: '시작 전', color: 'bg-gray-100 text-gray-600', icon: 'fa-hourglass-start' };
    if (todayCount >= totalSlots) return { text: '오늘 모든 일정 완료', color: 'bg-green-100 text-green-600', icon: 'fa-check-double' };
    
    // Check if all are done based on records matching slots logic (simplified here just by count for UI summary)
    return { text: `${todayCount} / ${totalSlots} 완료`, color: 'bg-blue-100 text-blue-600', icon: 'fa-list-check' };
  };

  const status = getStatusDisplay();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} (${['일','월','화','수','목','금','토'][date.getDay()]})`;
  };

  const formatTime = (dateString: string, recordTime?: string | null) => {
    if (recordTime) return recordTime; // Use explicit slot time if available
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-white/50 relative">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-2">
            <h2 className="text-2xl font-bold text-gray-800 break-words flex-1 pr-4">{habit.name}</h2>
            <div className="flex space-x-2">
                <button 
                    onClick={onEdit}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center"
                    title="습관 수정"
                >
                    <i className="fa-solid fa-pencil"></i>
                </button>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center"
                    title="닫기"
                >
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>
        </div>

        <div className="p-6 pt-2 space-y-6 h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* Status Badge */}
            <div className={`flex items-center p-4 rounded-xl ${status.color} bg-opacity-50 border border-current border-opacity-10`}>
                <div className={`w-10 h-10 rounded-full bg-white bg-opacity-60 flex items-center justify-center mr-3 shadow-sm`}>
                    <i className={`fa-solid ${status.icon}`}></i>
                </div>
                <div>
                    <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">오늘 진행 상황</p>
                    <p className="text-lg font-bold">{status.text}</p>
                </div>
            </div>

            {/* Description */}
            {habit.description && (
                <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">설명</h3>
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                        {habit.description}
                    </div>
                </div>
            )}

            {/* Time & Days */}
            <div className="grid grid-cols-1 gap-4">
                {/* Time */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">알림 시간</h3>
                    {habit.time.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {habit.time.map((t, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                    <i className="fa-regular fa-clock mr-1.5"></i>
                                    {t}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">설정된 시간이 없습니다.</p>
                    )}
                </div>

                {/* Days */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-2">반복 요일</h3>
                    <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-gray-100">
                        {days.map((day) => (
                            <div 
                                key={day}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    habit.days.includes(day) 
                                    ? 'bg-blue-500 text-white shadow-sm' 
                                    : 'text-gray-300'
                                }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="border-t border-gray-100 pt-4">
                <button 
                    onClick={toggleHistory}
                    className="flex items-center justify-between w-full text-left py-2 group"
                >
                    <span className="font-bold text-gray-700 flex items-center">
                        <i className="fa-solid fa-clock-rotate-left mr-2 text-blue-500"></i>
                        기록 내역
                    </span>
                    <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`}></i>
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${isHistoryOpen ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    {loadingHistory ? (
                        <div className="text-center py-4 text-sm text-gray-400">
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                            불러오는 중...
                        </div>
                    ) : history.length > 0 ? (
                        <div className="space-y-2">
                            {history.map(record => (
                                <div key={record.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-600">{formatDate(record.created_at)}</span>
                                        <span className="text-xs text-gray-400">{formatTime(record.created_at, record.recordTime)}</span>
                                    </div>
                                    <span className={`font-bold px-2 py-1 rounded ${record.result ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {record.result ? '성공' : '실패'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-lg">
                            아직 기록이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default HabitDetailModal;