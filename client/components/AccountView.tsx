import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const AccountView: React.FC = () => {
  const { session } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-in">
      <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-lg w-full max-w-md text-center border border-white/50">
        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner">
          <i className="fa-solid fa-user text-4xl text-blue-500"></i>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">내 계정</h2>
        <div className="bg-white/50 rounded-lg py-2 px-4 mb-8 inline-block">
             <p className="text-gray-600 font-medium">{session?.user.email}</p>
        </div>
        
        <div className="space-y-3">
            <button 
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-md flex items-center justify-center space-x-2"
            >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>로그아웃</span>
            </button>
        </div>
      </div>
      
      <div className="mt-8 text-gray-400 text-xs">
        ADHD 습관 도우미 v1.0
      </div>
    </div>
  );
};

export default AccountView;