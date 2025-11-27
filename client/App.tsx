
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HabitList from './components/HabitList';
import FloatingActionButton from './components/FloatingActionButton';
import BottomNavigation from './components/BottomNavigation';
import AccountView from './components/AccountView';
import AddHabitModal from './components/AddHabitModal';
import HabitDetailModal from './components/HabitDetailModal';
import Onboarding from './components/Onboarding';
import type { Habit, Day, HabitRecord } from './types';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'habits' | 'account'>('habits');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  
  // Show onboarding initially if not logged in
  const [showOnboarding, setShowOnboarding] = useState(true);

  const dayMap: Day[] = ['월', '화', '수', '목', '금', '토', '일'];

  const getHabitsAndRecords = useCallback(async () => {
      if (!session) {
        setHabitsLoading(false);
        setHabits([]);
        return;
      }

      // Only set loading true on initial load to prevent flicker during realtime updates
      if (habits.length === 0) setHabitsLoading(true);

      // 1. Fetch Habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habit')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: true });

      if (habitsError) {
        console.error('Error fetching habits:', habitsError);
        setHabitsLoading(false);
        return;
      }

      // 2. Fetch Today's Records
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      const { data: recordsData, error: recordsError } = await supabase
        .from('habitRecords')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString());

      if (recordsError) {
          console.error('Error fetching records:', recordsError);
      }

      if (habitsData) {
        const mappedHabits: Habit[] = habitsData.map((habit: any) => {
          // Find all records for this habit today
          const habitRecords = recordsData?.filter((r: any) => r.habit_id === habit.id) || [];

          return {
            id: habit.id,
            name: habit.name,
            description: habit.description,
            activate: habit.activate,
            time: habit.time || [],
            days: (habit.day || []).map((dayIndex: number) => dayMap[dayIndex]).filter(Boolean),
            todayRecords: habitRecords
          };
        });
        setHabits(mappedHabits);
      }
      setHabitsLoading(false);
  }, [session]); // Removed 'habits.length' to avoid loop, kept session

  // Initial Fetch & Realtime Subscription
  useEffect(() => {
    if (session) {
        getHabitsAndRecords();

        // Subscribe to changes in the 'habit' table to update UI automatically
        const habitChannel = supabase
            .channel('public-habit-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'habit' },
                (payload) => {
                    console.log('Habit change detected:', payload);
                    getHabitsAndRecords();
                }
            )
            .subscribe();

        // Subscribe to changes in the 'habitRecords' table
        const recordChannel = supabase
            .channel('public-record-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'habitRecords' },
                (payload) => {
                    console.log('Record change detected:', payload);
                    getHabitsAndRecords();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(habitChannel);
            supabase.removeChannel(recordChannel);
        };
    }
  }, [session, getHabitsAndRecords]);

  const handleRecordHabit = async (habitId: number, result: boolean) => {
      if (!session) return;

      const newRecordTemp: HabitRecord = {
          id: Date.now(), // Temporary ID for optimistic update
          user_id: session.user.id,
          habit_id: habitId,
          result: result,
          created_at: new Date().toISOString()
      };

      // Optimistic Update
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
            const updatedRecords = h.todayRecords ? [...h.todayRecords, newRecordTemp] : [newRecordTemp];
            const updated = { ...h, todayRecords: updatedRecords };
            // If the currently selected habit is being updated, update it too
            if (selectedHabit && selectedHabit.id === habitId) {
                setSelectedHabit(updated);
            }
            return updated;
        }
        return h;
      }));

      try {
        const { data, error } = await supabase
            .from('habitRecords')
            .insert([
                {
                    user_id: session.user.id,
                    habit_id: habitId,
                    result: result,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Update with actual DB record (replace temp)
        if (data && data[0]) {
             setHabits(prev => prev.map(h => {
                if (h.id === habitId) {
                    const filtered = (h.todayRecords || []).filter(r => r.id !== newRecordTemp.id);
                    return { ...h, todayRecords: [...filtered, data[0]] };
                }
                return h;
             }));
        }

      } catch (error: any) {
        console.error('Error recording habit:', error);
        alert('기록을 저장하는 중 오류가 발생했습니다.');
        getHabitsAndRecords(); // Revert on error
      }
  };

  const handleAddHabit = async (newHabitData: { name: string; description: string; days: number[]; time: string[]; activate: boolean }) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('habit')
        .insert([
          {
            user_id: session.user.id,
            name: newHabitData.name,
            description: newHabitData.description,
            day: newHabitData.days,
            time: newHabitData.time,
            activate: newHabitData.activate,
          },
        ]);

      if (error) throw error;
      
      // No need to manually update state here, Realtime subscription will catch it.
      // But for instant UX, we close modal.
      setIsModalOpen(false);

    } catch (error: any) {
      console.error('Error adding habit:', error);
      alert('습관을 추가하는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleUpdateHabit = async (habitData: { name: string; description: string; days: number[]; time: string[]; activate: boolean }) => {
    if (!session || !editingHabit) return;

    try {
        const { error } = await supabase
            .from('habit')
            .update({
                name: habitData.name,
                description: habitData.description,
                day: habitData.days,
                time: habitData.time,
                activate: habitData.activate
            })
            .eq('id', editingHabit.id);

        if (error) throw error;
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

  const handleHabitClick = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsDetailOpen(true);
  };

  const switchToEditMode = () => {
    if (selectedHabit) {
        setEditingHabit(selectedHabit);
        setIsDetailOpen(false);
        setIsModalOpen(true);
    }
  };

  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
            <div className="text-xl font-semibold text-gray-600">로딩 중...</div>
        </div>
    );
  }

  if (!session) {
    if (showOnboarding) {
        return <Onboarding onFinish={() => setShowOnboarding(false)} />;
    }
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 font-sans">
      <div className="container mx-auto max-w-2xl p-4 pb-28">
        {activeTab === 'habits' ? (
            <>
                <Header />
                <main>
                {habitsLoading && habits.length === 0 ? (
                    <div className="text-center py-10 text-gray-600">
                    습관 목록을 불러오는 중...
                    </div>
                ) : habits.length > 0 ? (
                    <HabitList 
                        habits={habits} 
                        onRecordHabit={handleRecordHabit}
                        onHabitClick={handleHabitClick}
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
      
      {/* Habit Detail Modal */}
      <HabitDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
            setIsDetailOpen(false);
            setSelectedHabit(null);
        }}
        habit={selectedHabit}
        onEdit={switchToEditMode}
      />

      {/* Add/Edit Modal */}
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
