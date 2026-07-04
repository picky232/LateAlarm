export function LoadingSpinner({ text = '불러오는 중...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
