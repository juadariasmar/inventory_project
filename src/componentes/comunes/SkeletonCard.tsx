export default function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-full" />
      ))}
    </div>
  )
}