
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AIChatView: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: '안녕하세요! 저는 당신의 ADHD 습관 코치입니다. 오늘 하루는 어떠신가요? 습관 실천에 어려움이 있다면 언제든 말씀해주세요.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput(''); // Clear input immediately
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
        const { data, error } = await supabase.functions.invoke('create-response', {
            body: { 
                userInput: userMessage 
            }
        });

        if (error) throw error;

        // The Edge Function returns { text: "..." }
        let responseText = '';

        if (data && typeof data.text === 'string') {
            responseText = data.text;
        } else if (typeof data === 'string') {
            // Handle potential stringified JSON response
            try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                    responseText = parsed.text;
                } else {
                    responseText = data;
                }
            } catch {
                responseText = data;
            }
        } else {
             // Fallback
             console.warn("Unexpected response format:", data);
             responseText = "AI 응답을 불러오지 못했습니다.";
        }
        
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error: any) {
        console.error("Error sending message:", error);
        setMessages(prev => [...prev, { role: 'model', text: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-24">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
            }`}>
               <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-gray-100 shadow-sm">
                    <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Input Area at the bottom (above nav bar which is h-20) */}
      <div className="fixed bottom-20 left-0 w-full z-40">
        <div className="max-w-2xl mx-auto px-4 pb-4 pt-2 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
            <form onSubmit={handleSend} className="relative flex items-center shadow-lg rounded-full">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="AI 코치에게 이야기해보세요..."
                    className="w-full pl-5 pr-12 py-3.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-sm"
                    disabled={isLoading}
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    <i className="fa-solid fa-paper-plane text-xs"></i>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
