'use client'

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Error</h1>
          <h2 className="text-2xl text-gray-400 mb-8">Something went wrong!</h2>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
