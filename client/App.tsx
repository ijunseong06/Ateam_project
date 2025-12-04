
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HabitList from './components/HabitList';
import BottomNavigation from './components/BottomNavigation';
import AccountView from './components/AccountView';
import AddHabitModal from './components/AddHabitModal';
import HabitDetailModal from './components/HabitDetailModal';
import Onboarding from './components/Onboarding';
import AIChatView from './components/AIChatView';
import FloatingActionButton from './components/FloatingActionButton';
import type { Habit, Day, HabitRecord } from './types';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'habits' | 'ai' | 'account'>('habits');
  
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
  }, [session]);

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

  // Insert Record (Create)
  const handleRecordHabit = async (habitId: number, result: boolean, targetTime?: string) => {
      if (!session) return;

      const recordDate = new Date();
      if (targetTime) {
          const [h, m] = targetTime.split(':').map(Number);
          recordDate.setHours(h, m, 0, 0);
      }
      const createdAt = recordDate.toISOString();

      const newRecordTemp: HabitRecord = {
          id: Date.now(), // Temporary ID for optimistic update
          user_id: session.user.id,
          habit_id: habitId,
          result: result,
          created_at: createdAt,
          recordTime: targetTime || null
      };

      // Optimistic Update
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
            const updatedRecords = h.todayRecords ? [...h.todayRecords, newRecordTemp] : [newRecordTemp];
            const updated = { ...h, todayRecords: updatedRecords };
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
                    created_at: createdAt,
                    recordTime: targetTime || null
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Update with actual DB record
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

  // Delete Record (Undo)
  const handleDeleteRecord = async (recordId: number) => {
      if (!session) return;

      // Optimistic Update
      setHabits(prev => prev.map(h => {
        if (h.todayRecords?.some(r => r.id === recordId)) {
            const updatedRecords = h.todayRecords.filter(r => r.id !== recordId);
            const updated = { ...h, todayRecords: updatedRecords };
            if (selectedHabit && selectedHabit.id === h.id) {
                setSelectedHabit(updated);
            }
            return updated;
        }
        return h;
      }));

      try {
          const { error } = await supabase
            .from('habitRecords')
            .delete()
            .eq('id', recordId);
        
        if (error) throw error;

      } catch (error: any) {
          console.error('Error deleting record:', error);
          alert('기록을 삭제하는 중 오류가 발생했습니다.');
          getHabitsAndRecords(); // Revert
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
      setIsModalOpen(false);

    } catch (error: any) {
      console.error('Error adding habit:', error);
      alert('습관을 추가하는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleUpdateHabit = async (habitData: { name: string; description: string; days: number[]; time: string[]; activate: boolean }) => {
    if (!session || !editingHabit) return;

    try {
        // Detect if schedule has changed to cleanup records
        const oldDays = editingHabit.days.map(d => dayMap.indexOf(d)).sort().join(',');
        const newDays = [...habitData.days].sort().join(',');
        const oldTime = [...editingHabit.time].sort().join(',');
        const newTime = [...habitData.time].sort().join(',');

        const scheduleChanged = oldDays !== newDays || oldTime !== newTime;

        if (scheduleChanged) {
            // Delete today's records for this habit
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { error: deleteError } = await supabase
                .from('habitRecords')
                .delete()
                .eq('habit_id', editingHabit.id)
                .gte('created_at', today.toISOString());
            
            if (deleteError) {
                console.error("Error clearing records:", deleteError);
            }
        }

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
        
        {activeTab === 'habits' && (
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
                        onDeleteRecord={handleDeleteRecord}
                        onHabitClick={handleHabitClick}
                    />
                ) : (
                    <div className="text-center py-10 px-4 bg-white/60 rounded-2xl shadow-lg">
                        <p className="text-gray-700 font-semibold">아직 추가된 습관이 없어요.</p>
                        <p className="text-gray-500 mt-2">우측 하단 + 버튼을 눌러 첫 습관을 만들어보세요!</p>
                    </div>
                )}
                </main>
            </>
        )}

        {activeTab === 'ai' && (
            <div className="h-full pt-2">
                <AIChatView />
            </div>
        )}

        {activeTab === 'account' && (
             <AccountView />
        )}
      </div>

      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Floating Action Button - Only for Habits Tab */}
      {activeTab === 'habits' && (
          <FloatingActionButton onClick={openAddModal} />
      )}

      {/* Modals */}
      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingHabit(null); }} 
        onSubmit={editingHabit ? handleUpdateHabit : handleAddHabit}
        initialData={editingHabit}
        onDelete={editingHabit ? handleDeleteHabit : undefined}
      />

      <HabitDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedHabit(null); }}
        habit={selectedHabit}
        onEdit={switchToEditMode}
      />
    </div>
  );
};

export default App;
