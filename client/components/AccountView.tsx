
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = 'BNQPEHTe7QjGMrWV3bc-pjbjRtk4PImwQL6IdiKQ3LQd7LseSPbIxVyhEB85yJswArFmtw9D_oFqxlMxS9NGIqU';

const AccountView: React.FC = () => {
  const { session } = useAuth();
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    // Check if Push is supported and if already subscribed
    const checkSubscription = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                
                // Also check DB status if needed, but for now rely on browser subscription existence
                // Ideally, we should also check if the DB says it's active, but the UI toggle usually reflects the browser state.
                setIsPushEnabled(!!subscription);
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        }
    };
    checkSubscription();
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handlePushToggle = async () => {
    if (pushLoading) return;
    setPushLoading(true);

    try {
        if (isPushEnabled) {
            // --- Unsubscribe Logic ---
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                // 1. Unsubscribe locally
                await subscription.unsubscribe();
                
                // 2. Update DB status to inactive
                const { error } = await supabase
                    .from('pushSub')
                    .update({ active: false })
                    .eq('user_id', session?.user.id);

                if (error) {
                    console.error('Error updating subscription status in DB:', error);
                }
            }
            setIsPushEnabled(false);
        } else {
            // --- Subscribe Logic ---
            
            if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes('YOUR_VAPID')) {
                alert('알림 기능을 사용하려면 VAPID Public Key 설정이 필요합니다.');
                setPushLoading(false);
                return;
            }

            // 1. Request Permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
                setPushLoading(false);
                return;
            }

            // 2. Register Service Worker (ensure it's active)
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // 3. Subscribe via PushManager
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // 4. Save to Database with new schema
            const { error } = await supabase
                .from('pushSub')
                .upsert({
                    user_id: session?.user.id,
                    sub_data: subscription.toJSON(),
                    active: true
                });

            if (error) throw error;
            
            setIsPushEnabled(true);
            alert('알림 설정이 완료되었습니다.');
        }
    } catch (error: any) {
        console.error('Push notification error:', error);
        alert('알림 설정을 변경하는 중 오류가 발생했습니다: ' + error.message);
        // Revert state check if failed
        if ('serviceWorker' in navigator) {
             const reg = await navigator.serviceWorker.ready;
             const sub = await reg.pushManager.getSubscription();
             setIsPushEnabled(!!sub);
        }
    } finally {
        setPushLoading(false);
    }
  };

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
        
        {/* Notification Toggle */}
        <div className="flex items-center justify-between bg-white/50 p-4 rounded-xl border border-gray-100 mb-6 w-full text-left">
            <div>
                <span className="font-bold text-gray-700 block">알림 수신</span>
                <span className="text-xs text-gray-500">하루 습관 알림 받기</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={isPushEnabled}
                    onChange={handlePushToggle}
                    disabled={pushLoading}
                    className="sr-only peer"
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isPushEnabled ? 'peer-checked:bg-blue-600' : ''}`}></div>
            </label>
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
