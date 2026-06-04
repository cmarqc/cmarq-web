export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-700 border-t-brand rounded-full animate-spin" />
        <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">Loading...</p>
      </div>
    </div>
  )
}
