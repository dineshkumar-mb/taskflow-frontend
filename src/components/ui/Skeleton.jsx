const Skeleton = ({ className = '', ...props }) => (
    <div
        className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
        {...props}
    />
);

export const CardSkeleton = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="grid grid-cols-3 gap-2 pt-2">
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
        </div>
    </div>
);

export const BoardColumnSkeleton = () => (
    <div className="w-72 flex-shrink-0 space-y-3">
        <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-6 rounded-full ml-auto" />
        </div>
        {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

export const MemberRowSkeleton = () => (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
    </div>
);

export default Skeleton;
