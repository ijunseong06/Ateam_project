
import React from 'react';
import type { Habit } from '../types';
import HabitItem from './HabitItem';

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: number) => void;
  onEditHabit: (habit: Habit) => void;
}

const HabitList: React.FC<HabitListProps> = ({ habits, onToggleHabit, onEditHabit }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700 px-2">오늘의 습관</h2>
      {habits.map(habit => (
        <HabitItem 
            key={habit.id} 
            habit={habit} 
            onToggle={() => onToggleHabit(habit.id)} 
            onEdit={() => onEditHabit(habit)}
        />
      ))}
    </div>
  );
};

export default HabitList;
