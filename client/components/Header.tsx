import React from 'react';

interface HeaderProps {
  onAccountClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAccountClick }) => {
  return (
    <header className="py-6 relative flex items-center justify-between px-2">
      <div className="w-10"></div> {/* Spacer for centering */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">
          ADHD 습관 도우미
        </h1>
        <p className="text-base text-gray-500 mt-1">
          차근차근, 하나씩 습관을 만들어가요.
        </p>
      </div>
      <div className="w-10 flex justify-end">
        {onAccountClick && (
            <button 
                onClick={onAccountClick}
                className="w-10 h-10 rounded-full bg-white text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center"
                aria-label="계정 설정"
            >
                <i className="fa-solid fa-user"></i>
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;