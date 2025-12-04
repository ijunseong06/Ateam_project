
import React from 'react';

interface BottomNavigationProps {
  activeTab: 'habits' | 'ai' | 'account';
  onTabChange: (tab: 'habits' | 'ai' | 'account') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 h-20">
      <div className="flex justify-around items-center h-full max-w-2xl mx-auto px-6">
        {/* Habits Tab */}
        <button
          onClick={() => onTabChange('habits')}
          className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors duration-200 ${
            activeTab === 'habits' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <i className="fa-solid fa-list-check text-2xl"></i>
          <span className="text-xs font-medium">습관</span>
        </button>

        {/* AI Chat Tab */}
        <button
          onClick={() => onTabChange('ai')}
          className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors duration-200 ${
            activeTab === 'ai' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <i className="fa-solid fa-robot text-2xl"></i>
          <span className="text-xs font-medium">AI 코치</span>
        </button>

        {/* Account Tab */}
        <button
          onClick={() => onTabChange('account')}
          className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors duration-200 ${
            activeTab === 'account' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <i className="fa-solid fa-user text-2xl"></i>
          <span className="text-xs font-medium">내 계정</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
