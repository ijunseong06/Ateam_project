
import type React from 'react';

export type Day = '월' | '화' | '수' | '목' | '금' | '토' | '일';

export interface HabitRecord {
  id: number;
  user_id: string;
  habit_id: number;
  result: boolean;
  created_at: string;
  recordTime?: string | null; // Renamed from 'time' to 'recordTime'
}

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  time: string[];
  days: Day[];
  activate: boolean;
  todayRecords?: HabitRecord[]; 
}