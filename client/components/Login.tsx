import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const GoogleIcon = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.099 34.599 44 30.021 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);


const Login: React.FC = () => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError('로그인 중 오류가 발생했습니다: ' + error.message);
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        setError(error.message);
    }
    setLoading(false);
  };
  
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (password !== passwordConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) {
        setError(error.message);
    } else if (data.user && !data.session) {
        setMessage('가입 확인을 위해 이메일을 확인해주세요.');
        // Optional: Clear fields or keep them
    } else if (data.user && data.session) {
        // Successfully signed up and logged in (if email confirmation is disabled)
    }
    setLoading(false);
  };

  const toggleView = (newView: 'login' | 'signup') => {
      setView(newView);
      setError('');
      setMessage('');
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg text-center">
        
        {view === 'login' ? (
            <>
                <header>
                    <h1 className="text-4xl font-bold text-gray-800">
                        ADHD 습관 도우미
                    </h1>
                    <p className="text-lg text-gray-500 mt-2">
                        로그인하고 습관 만들기를 시작하세요.
                    </p>
                </header>
                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-md transform transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100"
                    >
                        <GoogleIcon />
                        Google 계정으로 로그인
                    </button>

                    <div className="flex items-center justify-center space-x-2 my-4">
                        <hr className="w-full border-gray-300" />
                        <span className="px-2 text-gray-500 text-sm whitespace-nowrap">또는</span>
                        <hr className="w-full border-gray-300" />
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 text-gray-800 placeholder-gray-500"
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 text-gray-800 placeholder-gray-500"
                        />
                        
                        {message && <p className="text-sm text-green-600">{message}</p>}
                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-all shadow-md"
                        >
                            {loading ? '처리 중...' : '로그인'}
                        </button>
                    </form>
                    
                    <div className="mt-4 text-sm text-gray-600">
                        계정이 없으신가요?{' '}
                        <button 
                            onClick={() => toggleView('signup')}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                        >
                            이메일로 회원가입
                        </button>
                    </div>
                </div>
            </>
        ) : (
            <>
                <header>
                    <h1 className="text-3xl font-bold text-gray-800">
                        회원가입
                    </h1>
                    <p className="text-base text-gray-500 mt-2">
                        새로운 계정을 생성합니다.
                    </p>
                </header>
                <form onSubmit={handleEmailSignUp} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">이메일</label>
                        <input
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 text-gray-800 placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">비밀번호</label>
                        <input
                            type="password"
                            placeholder="6자 이상 입력해주세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 text-gray-800 placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">비밀번호 확인</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 다시 입력해주세요"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 text-gray-800 placeholder-gray-500"
                        />
                    </div>
                    
                    {message && <p className="text-sm text-green-600 text-center">{message}</p>}
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || !email || !password || !passwordConfirm}
                        className="w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300 transition-all shadow-md mt-2"
                    >
                        {loading ? '가입 중...' : '회원가입 완료'}
                    </button>
                    
                    <div className="mt-4 text-center">
                        <button 
                            type="button"
                            onClick={() => toggleView('login')}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium hover:underline"
                        >
                            ← 로그인 화면으로 돌아가기
                        </button>
                    </div>
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default Login;