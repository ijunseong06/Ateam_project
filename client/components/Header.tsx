import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-8 text-center relative">
      <h1 className="text-4xl font-bold text-gray-800">
        ADHD 습관 도우미
      </h1>
      <p className="text-lg text-gray-500 mt-2">
        차근차근, 하나씩 습관을 만들어가요.
      </p>
    </header>
  );
};

export default Header;