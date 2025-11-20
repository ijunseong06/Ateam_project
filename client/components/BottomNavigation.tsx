import React from 'react';

interface BottomNavigationProps {
  activeTab: 'habits' | 'account';
  onTabChange: (tab: 'habits' | 'account') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto pb-4">
        <button
          onClick={() => onTabChange('habits')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            activeTab === 'habits' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <i className="fa-solid fa-list-check text-xl"></i>
          <span className="text-xs font-medium">습관</span>
        </button>
        <button
          onClick={() => onTabChange('account')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            activeTab === 'account' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <i className="fa-solid fa-user text-xl"></i>
          <span className="text-xs font-medium">계정</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;