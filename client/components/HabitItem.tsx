
import React, { useState } from 'react';
import type { Habit, Day } from '../types';

interface HabitItemProps {
  habit: Habit;
  onRecord: (result: boolean, targetTime?: string) => void;
  onDeleteRecord: (recordId: number) => void;
  onClick: () => void;
}

const DayIndicator: React.FC<{ day: Day, isActive: boolean }> = ({ day, isActive }) => (
  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-300'}`}>
    {day}
  </div>
);

const HabitItem: React.FC<HabitItemProps> = ({ habit, onRecord, onDeleteRecord, onClick }) => {
  const allDays: Day[] = ['월', '화', '수', '목', '금', '토', '일'];
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Calculate if today is a scheduled day
  const today = new Date();
  const dayIndex = today.getDay(); // 0 is Sunday
  const kDays: Day[] = ['일', '월', '화', '수', '목', '금', '토'];
  const todayChar = kDays[dayIndex];
  
  const isScheduledToday = habit.days.includes(todayChar);

  // Helper to normalize time strings (e.g. "9:00" -> "09:00")
  const normalizeTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(':');
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Helper to find a record for a specific time slot
  const getRecordForSlot = (timeSlot: string) => {
    if (!habit.todayRecords) return undefined;
    const normalizedSlot = normalizeTime(timeSlot);
    
    return habit.todayRecords.find(r => {
        // Priority 1: Match by explicit recordTime field if available
        if (r.recordTime) {
            return normalizeTime(r.recordTime) === normalizedSlot;
        }

        // Priority 2: Match by created_at timestamp (Legacy/Fallback)
        const d = new Date(r.created_at);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}` === normalizedSlot;
    });
  };

  const handleSlotClick = (e: React.MouseEvent, time: string) => {
    e.stopPropagation();
    if (!habit.activate || !isScheduledToday) return;

    // Toggle selection
    if (selectedSlot === time) {
        setSelectedSlot(null);
    } else {
        setSelectedSlot(time);
    }
  };

  const handleAction = (e: React.MouseEvent, result: boolean) => {
    e.stopPropagation();
    
    // 긍정적인 피드백 메시지 설정
    const message = result 
        ? "정말 멋져요! 훌륭합니다! 🎉" 
        : "괜찮아요! 다음 기회에 화이팅! 💪";
    setFeedback(message);

    // 1.5초 후 피드백 제거
    setTimeout(() => {
        setFeedback(null);
    }, 1500);

    if (selectedSlot) {
        onRecord(result, selectedSlot);
        setSelectedSlot(null);
    } else if (habit.time.length === 0) {
        onRecord(result);
    }
  };

  const handleUndo = (e: React.MouseEvent, recordId: number) => {
      e.stopPropagation();
      onDeleteRecord(recordId);
      setSelectedSlot(null);
  };

  const renderActionArea = () => {
      if (!habit.activate) {
           return <div className="text-sm text-gray-400 font-medium px-2">-</div>;
      }
      
      if (!isScheduledToday) {
           return <div className="text-sm text-gray-400 font-medium px-2">휴식</div>;
      }

      // Case 1: Time-based habit
      if (habit.time.length > 0) {
          if (!selectedSlot) {
              // Summary view
              const total = habit.time.length;
              // Only count records that match one of the scheduled times
              const completedCount = habit.time.filter(t => getRecordForSlot(t)).length;
              
              if (completedCount > 0 && completedCount >= total) {
                   return (
                    <div className="flex items-center px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm whitespace-nowrap border border-emerald-200 shadow-sm">
                        <i className="fa-solid fa-check-double mr-2"></i>완료
                    </div>
                   );
              }
              return (
                <div className="text-xs text-gray-400 font-medium px-2 text-right">
                    <p className="animate-pulse">시간을 선택하세요</p>
                </div>
              );
          }

          // A slot is selected
          const record = getRecordForSlot(selectedSlot);
          
          if (record) {
              // Record exists for selected slot -> Allow Undo
              return (
                <div className="flex flex-col items-end animate-fade-in">
                    <span className="text-[10px] text-gray-500 font-bold mb-1 mr-1">{selectedSlot} 되돌리기</span>
                    <button
                        onClick={(e) => handleUndo(e, record.id)}
                        className="w-12 h-12 rounded-full bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm flex items-center justify-center border border-gray-200"
                        title="기록 삭제"
                    >
                        <i className="fa-solid fa-rotate-left text-lg"></i>
                    </button>
                </div>
              );
          } else {
              // No record -> Allow Record
              return (
                <div className="flex flex-col items-end animate-fade-in">
                    <span className="text-[10px] text-blue-600 font-bold mb-1 mr-1">{selectedSlot} 기록</span>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => handleAction(e, true)}
                            className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center ring-2 ring-emerald-200 hover:ring-emerald-500"
                            title="성공"
                        >
                            <i className="fa-solid fa-check text-xl"></i>
                        </button>
                        <button
                            onClick={(e) => handleAction(e, false)}
                            className="w-11 h-11 rounded-full bg-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center ring-2 ring-rose-200 hover:ring-rose-500"
                            title="실패"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                </div>
              );
          }
      }

      // Case 2: No specific time (All day)
      const hasRecord = habit.todayRecords && habit.todayRecords.length > 0;
      if (hasRecord) {
          const lastRecord = habit.todayRecords![habit.todayRecords!.length - 1];
          return (
             <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap shadow-sm ${
                    lastRecord.result 
                    ? 'bg-emerald-500 text-white border border-emerald-600' 
                    : 'bg-rose-500 text-white border border-rose-600'
                }`}>
                    {lastRecord.result ? '완료' : '실패'}
                </div>
                 <button 
                    onClick={(e) => handleUndo(e, lastRecord.id)}
                    className="text-xs text-gray-400 underline hover:text-gray-600"
                >
                    되돌리기
                </button>
             </div>
          );
      } else {
          return (
            <div className="flex gap-2 animate-fade-in">
                <button
                    onClick={(e) => handleAction(e, true)}
                    className="w-12 h-12 rounded-full bg-white text-emerald-500 border-2 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm flex items-center justify-center"
                >
                    <i className="fa-solid fa-check text-xl"></i>
                </button>
                <button
                    onClick={(e) => handleAction(e, false)}
                    className="w-12 h-12 rounded-full bg-white text-rose-500 border-2 border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm flex items-center justify-center"
                >
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
          );
      }
  };

  return (
    <div 
        onClick={onClick}
        className={`relative bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg cursor-pointer active:scale-[0.99] ${
            !habit.activate ? 'opacity-60 grayscale-[80%]' : ''
        } ${habit.time.length === 0 && habit.todayRecords?.length ? 'bg-gray-50/80' : ''}`}
    >
      {/* Feedback Overlay */}
      {feedback && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-md rounded-2xl animate-fade-in transition-all">
              <div className="text-center transform scale-110">
                <div className="text-4xl mb-2 animate-bounce">{feedback.includes('🎉') ? '🎉' : '💪'}</div>
                <p className="text-lg font-bold text-gray-800 break-keep px-4">{feedback.replace(/🎉|💪/g, '').trim()}</p>
              </div>
          </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center flex-1 overflow-hidden mr-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold text-gray-800 truncate">{habit.name}</p>
                {!habit.activate && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">비활성</span>}
            </div>
            {habit.description && <p className="text-sm text-gray-500 mb-3 line-clamp-1 font-medium">{habit.description}</p>}
            
            {/* Time Chips */}
            {habit.time.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {habit.time.sort().map((t, i) => {
                        const record = getRecordForSlot(t);
                        const isSelected = selectedSlot === t;
                        let chipClass = "bg-gray-100 text-gray-400 hover:bg-gray-200 border border-transparent"; // Default pending
                        let icon = null;

                        if (record) {
                            if (record.result) {
                                chipClass = "bg-emerald-500 text-white border-emerald-600 shadow-sm";
                                icon = <i className="fa-solid fa-check mr-1.5 text-[10px]"></i>;
                            } else {
                                chipClass = "bg-rose-500 text-white border-rose-600 shadow-sm";
                                icon = <i className="fa-solid fa-xmark mr-1.5 text-[10px]"></i>;
                            }
                        } else if (isSelected) {
                            chipClass = "bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1 shadow-md transform scale-105";
                        }

                        return (
                            <button 
                                key={i} 
                                onClick={(e) => handleSlotClick(e, t)}
                                className={`text-xs px-3 py-1.5 rounded-lg transition-all font-bold flex items-center ${chipClass}`}
                            >
                                {icon}
                                {t}
                            </button>
                        );
                    })}
                </div>
            )}
          </div>
        </div>
        
        {/* Action Area */}
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 min-w-[100px] flex justify-end items-center self-center">
            {renderActionArea()}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center px-1">
          {allDays.map(day => (
            <DayIndicator key={day} day={day} isActive={habit.days.includes(day)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HabitItem;
