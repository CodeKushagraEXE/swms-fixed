export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-[3px]', lg: 'w-12 h-12 border-4' }[size];
  return (
    <div className={`${s} border-blue-500/30 border-t-blue-500 rounded-full animate-spin`} />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
