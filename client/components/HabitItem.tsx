
import React, { useState, useEffect } from 'react';
import type { Habit, Day } from '../types';

interface HabitItemProps {
  habit: Habit;
  onRecord: (result: boolean) => void;
  onClick: () => void;
}

const DayIndicator: React.FC<{ day: Day, isActive: boolean }> = ({ day, isActive }) => (
  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
    {day}
  </div>
);

const HabitItem: React.FC<HabitItemProps> = ({ habit, onRecord, onClick }) => {
  const allDays: Day[] = ['월', '화', '수', '목', '금', '토', '일'];
  const [status, setStatus] = useState<{ 
      type: 'input' | 'countdown' | 'done' | 'rest' | 'none' | 'missed'; 
      message: string;
      activeSlotTime?: string;
  }>({ type: 'none', message: '' });
  
  // Calculate if today is a scheduled day
  const today = new Date();
  const dayIndex = today.getDay(); // 0 is Sunday
  const kDays: Day[] = ['일', '월', '화', '수', '목', '금', '토'];
  const todayChar = kDays[dayIndex];
  
  const isScheduledToday = habit.days.includes(todayChar);

  useEffect(() => {
    const checkStatus = () => {
        if (!isScheduledToday) {
            setStatus({ type: 'rest', message: '휴식' });
            return;
        }

        if (!habit.activate) {
            setStatus({ type: 'none', message: '' });
            return;
        }

        // Case 1: No specific time set (All day habit)
        if (habit.time.length === 0) {
            const hasRecord = habit.todayRecords && habit.todayRecords.length > 0;
            if (hasRecord) {
                const lastRecord = habit.todayRecords![habit.todayRecords!.length - 1];
                setStatus({ 
                    type: 'done', 
                    message: lastRecord.result ? '완료' : '실패' 
                });
            } else {
                setStatus({ type: 'input', message: '' });
            }
            return;
        }

        // Case 2: Specific times set
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // 1. Parse and Sort Schedule Times
        const slots = habit.time.map(t => {
            const [h, m] = t.split(':').map(Number);
            return { minutes: h * 60 + m, original: t };
        }).sort((a, b) => a.minutes - b.minutes);

        // 2. Identify which slots are already completed by matching records
        const completedSlotIndices = new Set<number>();
        const records = [...(habit.todayRecords || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        records.forEach(record => {
            const d = new Date(record.created_at);
            const recMinutes = d.getHours() * 60 + d.getMinutes();
            
            let bestSlotIdx = -1;
            let minDist = Infinity;

            slots.forEach((slot, idx) => {
                if (completedSlotIndices.has(idx)) return;
                
                const dist = Math.abs(slot.minutes - recMinutes);
                
                // Allow matching if record is within reasonable proximity (e.g., 2 hours)
                if (dist < 120 && dist < minDist) {
                    minDist = dist;
                    bestSlotIdx = idx;
                }
            });

            if (bestSlotIdx !== -1) {
                completedSlotIndices.add(bestSlotIdx);
            }
        });

        // 3. Determine current status based on the first "Actionable" slot
        let foundActionable = false;

        for (let i = 0; i < slots.length; i++) {
            if (completedSlotIndices.has(i)) continue; // This slot is done

            const slot = slots[i];
            const slotMinutes = slot.minutes;
            
            // Logic change: Allow input if within 1 hour before OR after (Range +/- 60 mins)
            // timeDiff > 0 means Future (Slot is ahead of Current)
            const timeDiff = slotMinutes - currentMinutes;

            if (timeDiff > 60) {
                // More than 60 mins remaining -> Countdown
                const hours = Math.floor(timeDiff / 60);
                const mins = timeDiff % 60;
                
                let timeMsg = "";
                if (hours > 0) timeMsg += `${hours}시간 `;
                timeMsg += `${mins}분`;

                setStatus({ 
                    type: 'countdown', 
                    message: `${timeMsg} 후 알림`,
                    activeSlotTime: slot.original
                });
                foundActionable = true;
                break; 
            } 
            else if (timeDiff <= 60 && timeDiff >= -60) {
                // Within 1 hour window (Before or After) -> Input
                setStatus({ 
                    type: 'input', 
                    message: '',
                    activeSlotTime: slot.original 
                });
                foundActionable = true;
                break;
            } 
            // If timeDiff < -60, it's missed/expired. Continue to next slot.
        }

        // 4. If no actionable slots found
        if (!foundActionable) {
            if (slots.length > 0) {
                 if (completedSlotIndices.size === slots.length) {
                     setStatus({ type: 'done', message: '모두 완료' });
                 } else {
                     setStatus({ type: 'done', message: '오늘 일정 종료' });
                 }
            }
        }
    };

    checkStatus();
    // Check every 10 seconds to ensure countdown feels responsive
    const interval = setInterval(checkStatus, 10000); 
    return () => clearInterval(interval);
  }, [habit, isScheduledToday]);

  const renderActionArea = () => {
      if (!habit.activate) {
           return <div className="text-sm text-gray-400 font-medium px-2">-</div>;
      }

      switch (status.type) {
        case 'rest':
            return <div className="text-sm text-gray-400 font-medium px-2">휴식</div>;
        case 'done':
            return (
                <div className="flex items-center px-4 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm whitespace-nowrap">
                    {status.message === '모두 완료' ? (
                        <><i className="fa-solid fa-check-double mr-2 text-green-500"></i>완료</>
                    ) : (
                        status.message
                    )}
                </div>
            );
        case 'countdown':
             return (
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-medium mb-1 mr-1">{status.activeSlotTime} 일정</span>
                    <div className="flex items-center text-xs text-blue-600 font-medium px-3 py-1.5 bg-blue-50 rounded-lg whitespace-nowrap border border-blue-100">
                        <i className="fa-regular fa-clock mr-1.5"></i>
                        {status.message}
                    </div>
                </div>
             );
        case 'input':
            return (
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-blue-500 font-bold mb-1 mr-1 animate-pulse">{status.activeSlotTime} 입력 가능</span>
                    <div className="flex gap-2 animate-fade-in">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRecord(true); }}
                            className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                            title={`${status.activeSlotTime} 일정 완료`}
                        >
                            <i className="fa-solid fa-check text-xl"></i>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRecord(false); }}
                            className="w-12 h-12 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                            title="실패"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                </div>
            );
        default:
            return null;
      }
  };

  return (
    <div 
        onClick={onClick}
        className={`bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl cursor-pointer active:scale-[0.98] ${
            !habit.activate ? 'opacity-50 grayscale-[50%]' : ''
        } ${status.type === 'done' ? 'bg-gray-50/50' : 'border-gray-200/50'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-gray-800 truncate">{habit.name}</p>
                {!habit.activate && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">비활성</span>}
            </div>
            {habit.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{habit.description}</p>}
            {habit.time.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {habit.time.map((t, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-md ${
                            status.activeSlotTime === t 
                                ? (status.type === 'input' ? 'bg-blue-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600') 
                                : 'bg-gray-100 text-gray-400'
                        }`}>
                            {t}
                        </span>
                    ))}
                </div>
            )}
          </div>
        </div>
        
        {/* Action Area */}
        <div onClick={(e) => e.stopPropagation()} className="pl-4 flex-shrink-0">
            {renderActionArea()}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200/80">
        <div className="flex justify-between items-center space-x-1">
          {allDays.map(day => (
            <DayIndicator key={day} day={day} isActive={habit.days.includes(day)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HabitItem;
