'use client';

import { useRouter } from 'next/navigation';
import { useUserPreferences } from '@/frontend/hooks/useUserPreferences';
import { SettingsPanel } from '@/frontend/components/Settings/SettingsPanel';

export default function SettingsPage() {
  const router = useRouter();
  const { prefs, update } = useUserPreferences();

  return (
    <main className="min-h-dvh bg-gray-50">
      <header className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <button
          aria-label="뒤로가기"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600"
        >
          ←
        </button>
        <h1 className="text-lg font-black text-gray-900">설정</h1>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <SettingsPanel prefs={prefs} onChange={update} />
        </div>
        <p className="text-xs text-gray-300 text-center mt-6">
          설정은 이 기기에만 저장됩니다
        </p>
      </div>
    </main>
  );
}
