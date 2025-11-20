
import React from 'react';
import type { Habit, Day } from '../types';

interface HabitItemProps {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
}

const DayIndicator: React.FC<{ day: Day, isActive: boolean }> = ({ day, isActive }) => (
  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
    {day}
  </div>
);

const HabitItem: React.FC<HabitItemProps> = ({ habit, onToggle, onEdit }) => {
  const allDays: Day[] = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div 
        onClick={onEdit}
        className="bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200/50 transition-all duration-300 hover:shadow-xl cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div>
            <p className="text-lg font-bold text-gray-800">{habit.name}</p>
            {habit.description && <p className="text-sm text-gray-500 mt-1">{habit.description}</p>}
          </div>
        </div>
        <div 
            className="flex items-center" 
            onClick={(e) => e.stopPropagation()}
        >
          <label htmlFor={`toggle-${habit.id}`} className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" id={`toggle-${habit.id}`} className="sr-only" checked={habit.activate} onChange={onToggle} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${habit.activate ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${habit.activate ? 'translate-x-6' : ''}`}></div>
            </div>
          </label>
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
