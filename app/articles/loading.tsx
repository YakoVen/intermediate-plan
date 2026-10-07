export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 flex gap-8 animate-pulse">
      <div className="hidden md:block w-64 bg-gray-200 h-[600px] rounded-xl"></div>
      <div className="flex-1 space-y-6">
        <div className="flex justify-between gap-4">
          <div className="w-full max-w-md bg-gray-200 h-10 rounded-xl"></div>
          <div className="w-40 bg-gray-200 h-10 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-gray-200 h-64 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
