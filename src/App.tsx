import React, { useEffect } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { LeftConfigPanel } from '@/components/layout/LeftConfigPanel';
import { RightEditorPanel } from '@/components/layout/RightEditorPanel';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { Toaster, toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const theme = useSoundEventStore((s) => s.theme);
  const importShareHash = useSoundEventStore((s) => s.importShareHash);

  useEffect(() => {
    // Check URL share hash (#s=...)
    if (window.location.hash.startsWith('#s=')) {
      const ok = importShareHash(window.location.hash);
      if (!ok) {
        toast.error(t('ui.shareUrlFailed'));
      }
    }
  }, [importShareHash, t]);

  return (
    <div className="bg-white text-gray-900 dark:bg-[#0B0F17] dark:text-gray-100 h-screen h-[100dvh] overflow-hidden flex flex-col font-sans antialiased transition-colors duration-150">
      <Toaster theme={theme} position="bottom-right" richColors />
      <HeaderBar />
      <main className="w-full flex-1 min-h-0 flex flex-col lg:flex-row border-t border-gray-200 dark:border-gray-800 overflow-hidden relative">
        <LeftConfigPanel />
        <RightEditorPanel />
      </main>
    </div>
  );
};

export default App;
