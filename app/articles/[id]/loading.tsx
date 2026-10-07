export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/2 space-y-4">
          <div className="aspect-square bg-gray-200 rounded-2xl"></div>
          <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="w-20 h-20 bg-gray-200 rounded-xl"></div>)}
          </div>
        </div>
        <div className="lg:w-1/2 space-y-8">
          <div className="h-10 bg-gray-200 w-3/4 rounded-xl"></div>
          <div className="h-8 bg-gray-200 w-1/4 rounded-xl"></div>
          <div className="space-y-4 pt-8">
            <div className="h-14 bg-gray-200 w-full rounded-xl"></div>
            <div className="h-14 bg-gray-200 w-full rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
