
import React from 'react';
import type { Habit } from '../types';
import HabitItem from './HabitItem';

interface HabitListProps {
  habits: Habit[];
  onRecordHabit: (id: number, result: boolean, targetTime?: string) => void;
  onDeleteRecord: (recordId: number) => void;
  onHabitClick: (habit: Habit) => void;
}

const HabitList: React.FC<HabitListProps> = ({ habits, onRecordHabit, onDeleteRecord, onHabitClick }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700 px-2">오늘의 습관</h2>
      {habits.map(habit => (
        <HabitItem 
            key={habit.id} 
            habit={habit} 
            onRecord={(result, targetTime) => onRecordHabit(habit.id, result, targetTime)} 
            onDeleteRecord={onDeleteRecord}
            onClick={() => onHabitClick(habit)}
        />
      ))}
    </div>
  );
};

export default HabitList;
