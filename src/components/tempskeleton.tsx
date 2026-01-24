import { Skeleton } from './ui/skeleton'; // Adjust path to your Shadcn component

const FullScreenSkeleton = () => {
  return (
    // 1. fixed inset-0: Locks to screen edges
    // 2. z-[9999]: Covers EVERYTHING (even your navbar)
    // 3. bg-white: Solid background so nothing bleeds through
    <div className="fixed inset-0 z-50 flex flex-col p-4 space-y-4">
      
      {/* --- Header / Navbar Skeleton --- */}
      <div className="flex items-center justify-between space-x-4 border-b pb-4">
        <div className="flex items-center space-x-4">
            {/* Logo placeholder */}
            <Skeleton className="h-10 w-10 rounded-full" />
            {/* Title placeholder */}
            <Skeleton className="h-6 w-48" />
        </div>
        {/* User profile placeholder */}
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex h-full gap-6 pt-2">
        
        {/* Left Sidebar (Hidden on mobile usually, but shown here for effect) */}
        <div className="hidden w-64 flex-col space-y-4 md:flex">
          {Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>

        {/* Right Content Grid */}
        <div className="flex-1 space-y-6">
            
            {/* Hero / Banner Area */}
            <Skeleton className="h-48 w-full rounded-xl" />
            
            {/* Three Cards Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
               <Skeleton className="h-32 rounded-xl" />
               <Skeleton className="h-32 rounded-xl" />
               <Skeleton className="h-32 rounded-xl" />
            </div>

            {/* List / Table Area */}
            <div className="space-y-3">
               <Skeleton className="h-4 w-3/4" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-5/6" />
               <Skeleton className="h-4 w-full" />
            </div>
        </div>

      </div>
    </div>
  );
};

export default FullScreenSkeleton;