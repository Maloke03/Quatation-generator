export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-[#0d2014] rounded-xl p-4 animate-pulse ${className}`}>
      <div className="h-4 bg-[#1e3a2a] rounded w-1/3 mb-3"></div>
      <div className="h-6 bg-[#1e3a2a] rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-[#1e3a2a] rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}