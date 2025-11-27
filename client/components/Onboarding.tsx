
import React, { useState } from 'react';

interface OnboardingProps {
  onFinish: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "ADHD 습관 도우미",
      description: "더 나은 내일을 위한 작은 변화.\n긍정적인 습관 형성을 도와드려요.",
      icon: "fa-seedling",
      color: "text-green-500",
      bg: "bg-green-100"
    },
    {
      title: "나만의 습관 설정",
      description: "원하는 요일과 시간에 맞춰\n세심하게 습관을 관리해보세요.",
      icon: "fa-list-check",
      color: "text-blue-500",
      bg: "bg-blue-100"
    },
    {
      title: "챗봇과 함께 점검",
      description: "AI 챗봇과 대화하며 오늘 하루\n지켜야 할 습관을 꼼꼼히 챙겨보세요.",
      icon: "fa-robot",
      color: "text-purple-500",
      bg: "bg-purple-100"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/50 relative min-h-[500px] flex flex-col">
        
        {/* Slide Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in transition-all duration-300">
          <div className={`w-32 h-32 ${slides[currentSlide].bg} rounded-full flex items-center justify-center mb-8 shadow-inner transition-colors duration-500`}>
            <i className={`fa-solid ${slides[currentSlide].icon} text-5xl ${slides[currentSlide].color} transition-colors duration-500`}></i>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4 transition-all duration-300">
            {slides[currentSlide].title}
          </h2>
          
          <p className="text-gray-600 leading-relaxed whitespace-pre-line transition-all duration-300">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Navigation & Indicators */}
        <div className="p-8 pt-0">
          {/* Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {slides.map((_, index) => (
              <div 
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-blue-500 w-6' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                currentSlide === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              <i className="fa-solid fa-arrow-left text-xl"></i>
            </button>

            {currentSlide === slides.length - 1 ? (
              <button
                onClick={onFinish}
                className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center space-x-2"
              >
                <span>시작하기</span>
                <i className="fa-solid fa-rocket"></i>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-800 text-white shadow-md hover:bg-gray-700 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-arrow-right text-xl"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
