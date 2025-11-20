
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HabitList from './components/HabitList';
import FloatingActionButton from './components/FloatingActionButton';
import BottomNavigation from './components/BottomNavigation';
import AccountView from './components/AccountView';
import AddHabitModal from './components/AddHabitModal';
import type { Habit, Day } from './types';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'habits' | 'account'>('habits');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const dayMap: Day[] = ['월', '화', '수', '목', '금', '토', '일'];

  useEffect(() => {
    const getHabits = async () => {
      if (!session) {
        setHabitsLoading(false);
        setHabits([]);
        return;
      }

      setHabitsLoading(true);
      const { data, error } = await supabase
        .from('habit')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching habits:', error);
      } else if (data) {
        const mappedHabits: Habit[] = data.map((habit: any) => ({
          id: habit.id,
          name: habit.name,
          description: habit.description,
          activate: habit.activate,
          days: (habit.day || []).map((dayIndex: number) => dayMap[dayIndex]).filter(Boolean),
        }));
        setHabits(mappedHabits);
      }
      setHabitsLoading(false);
    };

    if (session) {
        getHabits();
    }
  }, [session]);

  const toggleHabit = async (id: number) => {
    const habitToToggle = habits.find(h => h.id === id);
    if (!habitToToggle) return;

    const newActiveState = !habitToToggle.activate;
    
    // Optimistic UI update
    const originalHabits = habits;
    setHabits(habits.map(habit =>
      habit.id === id ? { ...habit, activate: newActiveState } : habit
    ));

    const { error } = await supabase
      .from('habit')
      .update({ activate: newActiveState })
      .eq('id', id);

    if (error) {
      console.error('Error updating habit:', error);
      // Revert UI if update fails
      setHabits(originalHabits);
    }
  };

  const handleAddHabit = async (newHabitData: { name: string; description: string; days: number[] }) => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('habit')
        .insert([
          {
            user_id: session.user.id,
            name: newHabitData.name,
            description: newHabitData.description,
            day: newHabitData.days, // days -> day column mapping
            activate: true,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        const createdHabit = data[0];
        const mappedHabit: Habit = {
          id: createdHabit.id,
          name: createdHabit.name,
          description: createdHabit.description,
          activate: createdHabit.activate,
          days: (createdHabit.day || []).map((index: number) => dayMap[index]),
        };
        
        setHabits(prev => [...prev, mappedHabit]);
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error('Error adding habit:', error);
      alert('습관을 추가하는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleUpdateHabit = async (habitData: { name: string; description: string; days: number[] }) => {
    if (!session || !editingHabit) return;

    try {
        const { error } = await supabase
            .from('habit')
            .update({
                name: habitData.name,
                description: habitData.description,
                day: habitData.days
            })
            .eq('id', editingHabit.id);

        if (error) throw error;

        setHabits(prev => prev.map(h => {
            if (h.id === editingHabit.id) {
                return {
                    ...h,
                    name: habitData.name,
                    description: habitData.description,
                    days: habitData.days.map(idx => dayMap[idx])
                };
            }
            return h;
        }));
        setIsModalOpen(false);
        setEditingHabit(null);

    } catch (error: any) {
        console.error('Error updating habit:', error);
        alert('습관을 수정하는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleDeleteHabit = async (id: number) => {
    if (!session) return;

    try {
        const { error } = await supabase
            .from('habit')
            .delete()
            .eq('id', id);
        
        if (error) throw error;

        setHabits(prev => prev.filter(h => h.id !== id));
        setIsModalOpen(false);
        setEditingHabit(null);

    } catch (error: any) {
        console.error('Error deleting habit:', error);
        alert('습관을 삭제하는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const openAddModal = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
      setEditingHabit(habit);
      setIsModalOpen(true);
  };

  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
            <div className="text-xl font-semibold text-gray-600">로딩 중...</div>
        </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 font-sans">
      <div className="container mx-auto max-w-2xl p-4 pb-28">
        {activeTab === 'habits' ? (
            <>
                <Header />
                <main>
                {habitsLoading ? (
                    <div className="text-center py-10 text-gray-600">
                    습관 목록을 불러오는 중...
                    </div>
                ) : habits.length > 0 ? (
                    <HabitList 
                        habits={habits} 
                        onToggleHabit={toggleHabit} 
                        onEditHabit={openEditModal}
                    />
                ) : (
                    <div className="text-center py-10 px-4 bg-white/60 rounded-2xl shadow-lg">
                        <p className="text-gray-700 font-semibold">아직 추가된 습관이 없어요.</p>
                        <p className="text-gray-500 mt-2">우측 하단의 '+' 버튼을 눌러 첫 습관을 추가해보세요!</p>
                    </div>
                )}
                </main>
                <FloatingActionButton onClick={openAddModal} />
            </>
        ) : (
            <AccountView />
        )}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setEditingHabit(null);
        }} 
        onSubmit={editingHabit ? handleUpdateHabit : handleAddHabit}
        initialData={editingHabit}
        onDelete={editingHabit ? handleDeleteHabit : undefined}
      />
    </div>
  );
};

export default App;
