'use client';
import { useState, useEffect } from 'react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 text-lg"
      >
        <span>📱 تثبيت تطبيق المنصة على جوالك</span>
      </button>
    </div>
  );
}
import InstallButton from '@/components/InstallButton';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      {/* محتوى موقعك الحالي */}
      <h1 className="text-3xl font-bold text-center mt-10">أهلاً بك في منصة إنْتَالَم</h1>
      
      {/* زر التثبيت التلقائي */}
      <InstallButton />
    </main>
  );
}
