export default function WorkspacePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-400">
      <svg className="h-16 w-16 opacity-30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p className="text-lg">Select a document or create a new one</p>
    </div>
  )
}
