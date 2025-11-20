
import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-3xl font-light hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-110 z-40"
      aria-label="새 습관 추가"
    >
      +
    </button>
  );
};

export default FloatingActionButton;
