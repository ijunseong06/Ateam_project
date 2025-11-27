
import React, { useState, useEffect } from 'react';
import type { Day, Habit } from '../types';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habit: { name: string; description: string; days: number[]; time: string[]; activate: boolean }) => void;
  initialData?: Habit | null;
  onDelete?: (id: number) => void;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onSubmit, initialData, onDelete }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddingTime, setIsAddingTime] = useState(false);

  const days: Day[] = ['월', '화', '수', '목', '금', '토', '일'];

  // Reset or Populate form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      setCurrentTime('');
      setIsAddingTime(false);
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setTimes(initialData.time || []);
        setIsActive(initialData.activate);
        // Map string days ['월', '화'] back to indices [0, 1]
        const dayIndices = initialData.days
          .map(d => days.indexOf(d))
          .filter(idx => idx !== -1);
        setSelectedDays(dayIndices);
      } else {
        setName('');
        setDescription('');
        setTimes([]);
        setSelectedDays([]);
        setIsActive(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleDay = (index: number) => {
    if (selectedDays.includes(index)) {
      setSelectedDays(selectedDays.filter(d => d !== index));
    } else {
      setSelectedDays([...selectedDays, index].sort());
    }
  };

  const handleAddTime = () => {
    if (currentTime && !times.includes(currentTime)) {
      setTimes([...times, currentTime].sort());
      setCurrentTime('');
      setIsAddingTime(false);
    }
  };

  const handleCancelTime = () => {
    setIsAddingTime(false);
    setCurrentTime('');
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setTimes(times.filter(t => t !== timeToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({ 
      name, 
      description, 
      days: selectedDays,
      time: times,
      activate: isActive
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (initialData && onDelete) {
        onDelete(initialData.id);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-white/50">
        {showDeleteConfirm ? (
             <div className="p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">습관 삭제</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    정말로 이 습관을 삭제하시겠습니까?<br/>
                    <span className="text-red-500 font-medium text-sm">삭제된 데이터는 복구할 수 없습니다.</span>
                </p>
                <div className="flex space-x-3">
                    <button 
                        onClick={handleCancelDelete} 
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                        type="button"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleConfirmDelete} 
                        className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md"
                        type="button"
                    >
                        삭제하기
                    </button>
                </div>
             </div>
        ) : (
            <div className="p-6 h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {initialData ? '습관 수정' : '새 습관 추가'}
                </h2>
                {initialData && onDelete && (
                    <button 
                        type="button"
                        onClick={handleDeleteClick}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors group"
                        title="습관 삭제"
                    >
                        <i className="fa-solid fa-trash-can text-xl transition-transform group-hover:scale-110"></i>
                    </button>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Active Toggle */}
                <div className="flex items-center justify-between bg-white/50 p-4 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-700">습관 활성화</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Name Input */}
                <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                    습관 이름 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 아침에 물 마시기"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 text-gray-800 placeholder-gray-400 transition-all"
                    required
                />
                </div>

                {/* Description Input */}
                <div>
                <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-2">
                    설명 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="습관에 대한 간단한 메모를 남겨보세요"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 text-gray-800 placeholder-gray-400 transition-all resize-none"
                />
                </div>

                {/* Time Input */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        알림 시간 <span className="text-gray-400 font-normal">(선택)</span>
                    </label>
                    
                    {/* Time List */}
                    {times.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {times.map((time, index) => (
                                <div key={index} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm animate-fade-in">
                                    <span className="text-sm font-medium mr-2">{time}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTime(time)}
                                        className="text-blue-400 hover:text-red-500 focus:outline-none"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isAddingTime ? (
                        <div className="flex gap-2 items-center animate-fade-in">
                            <input
                                type="time"
                                value={currentTime}
                                onChange={(e) => setCurrentTime(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 text-gray-800"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={handleAddTime}
                                disabled={!currentTime}
                                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                확인
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelTime}
                                className="px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap"
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsAddingTime(true)}
                            className="flex items-center text-blue-600 hover:text-blue-800 font-bold transition-colors px-2 py-2 -ml-2 rounded-lg hover:bg-blue-50 text-sm"
                        >
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <i className="fa-solid fa-plus text-xs"></i>
                            </div>
                            시간 추가하기
                        </button>
                    )}
                </div>

                {/* Days Selector */}
                <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">반복 요일</label>
                <div className="flex justify-between items-center gap-1">
                    {days.map((day, index) => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                        selectedDays.includes(index)
                            ? 'bg-blue-500 text-white shadow-md scale-110'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                    >
                        {day}
                    </button>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">
                    {selectedDays.length === 0 
                    ? '요일을 선택하지 않으면 매일 반복됩니다.' 
                    : `${selectedDays.length}일 선택됨`}
                </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white/0">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    취소
                </button>
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md"
                >
                    {initialData ? '수정 완료' : '저장'}
                </button>
                </div>
            </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default AddHabitModal;
