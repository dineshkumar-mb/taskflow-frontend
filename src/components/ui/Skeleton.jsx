/**
 * Skeleton.jsx
 * Centralised skeleton loading components for every screen.
 * Uses CSS variables (v-primary, v-border, v-secondary) for dark/light mode support.
 */

/* ─── Base Shimmer Block ────────────────────────────────────────────────────── */
const Skeleton = ({ className = '', ...props }) => (
    <div
        className={`rounded-md skeleton-shimmer ${className}`}
        {...props}
    />
);

/* ─── Generic Reusable Pieces ───────────────────────────────────────────────── */

/** Simple avatar circle */
export const AvatarSkeleton = ({ size = 'md' }) => {
    const sizes = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-12 w-12' };
    return <Skeleton className={`rounded-full ${sizes[size]}`} />;
};

/** Horizontal text line */
export const LineSkeleton = ({ width = 'full', height = 4 }) => (
    <Skeleton className={`h-${height} w-${width}`} />
);

/* ─── Dashboard ─────────────────────────────────────────────────────────────── */

export const StatCardSkeleton = () => (
    <div className="bg-v-primary p-6 rounded-xl border border-v-border shadow-sm">
        <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
            </div>
        </div>
    </div>
);

export const ChartCardSkeleton = () => (
    <div className="bg-v-primary p-6 rounded-xl border border-v-border shadow-sm">
        <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-44" />
        </div>
        {/* Fake bar chart */}
        <div className="h-[280px] flex items-end gap-3 px-4">
            {[60, 85, 45, 70, 90, 50, 75].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
        </div>
    </div>
);

export const DashboardSkeleton = () => (
    <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
        </div>
    </div>
);

/* ─── Board / Kanban ────────────────────────────────────────────────────────── */

export const IssueCardSkeleton = () => (
    <div className="rounded-xl border border-v-border bg-v-primary p-4 shadow-sm space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
        </div>
    </div>
);

export const BoardColumnSkeleton = ({ cardCount = 4 }) => (
    <div className="w-72 flex-shrink-0 space-y-3">
        <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-6 rounded-full ml-auto" />
        </div>
        {[...Array(cardCount)].map((_, i) => <IssueCardSkeleton key={i} />)}
    </div>
);

export const BoardPageSkeleton = () => (
    <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <div className="ml-auto flex gap-2">
                <Skeleton className="h-9 w-36 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
        </div>
        {/* Columns */}
        <div className="flex gap-6 overflow-x-auto pb-6">
            {[4, 3, 5, 2].map((n, i) => <BoardColumnSkeleton key={i} cardCount={n} />)}
        </div>
    </div>
);

/* ─── Backlog ────────────────────────────────────────────────────────────────── */

export const BacklogRowSkeleton = () => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-v-border">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-3/5" />
        <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
        </div>
    </div>
);

export const BacklogPageSkeleton = () => (
    <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        {/* Sprint groups */}
        {[...Array(3)].map((_, g) => (
            <div key={g} className="rounded-xl border border-v-border overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-v-secondary">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-20 rounded-full ml-auto" />
                </div>
                {[...Array(g === 0 ? 5 : 3)].map((_, r) => <BacklogRowSkeleton key={r} />)}
            </div>
        ))}
    </div>
);

/* ─── Sprint ─────────────────────────────────────────────────────────────────── */

export const SprintCardSkeleton = () => (
    <div className="rounded-xl border border-v-border bg-v-primary p-5 space-y-4">
        <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-v-border">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-5 w-14 rounded-full ml-auto" />
                </div>
            ))}
        </div>
    </div>
);

export const SprintPageSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        {[...Array(2)].map((_, i) => <SprintCardSkeleton key={i} />)}
    </div>
);

/* ─── Members ────────────────────────────────────────────────────────────────── */

export const MemberRowSkeleton = () => (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-v-border">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
);

export const MembersPageSkeleton = () => (
    <div className="rounded-xl border border-v-border overflow-hidden">
        {/* Invite bar */}
        <div className="flex items-center gap-3 p-4 border-b border-v-border bg-v-secondary">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        {[...Array(6)].map((_, i) => <MemberRowSkeleton key={i} />)}
    </div>
);

/* ─── Reports ────────────────────────────────────────────────────────────────── */

export const ReportsPageSkeleton = () => (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
        </div>
    </div>
);

/* ─── Billing ────────────────────────────────────────────────────────────────── */

export const BillingPageSkeleton = () => (
    <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="rounded-xl border border-v-border p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>
        </div>
        <div className="rounded-xl border border-v-border p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-v-border">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    </div>
);

/* ─── Admin Billing ──────────────────────────────────────────────────────────── */

export const TableRowSkeleton = ({ cols = 5 }) => (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-v-border">
        {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-8' : i === cols - 1 ? 'w-20' : 'flex-1'}`} />
        ))}
    </div>
);

export const AdminBillingPageSkeleton = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-72" />
            </div>
        </div>
        {/* Tab bar */}
        <div className="flex gap-2 border-b border-v-border pb-1">
            <Skeleton className="h-8 w-36 rounded-t-lg" />
            <Skeleton className="h-8 w-28 rounded-t-lg" />
        </div>
        {/* Search */}
        <Skeleton className="h-10 w-72 rounded-xl" />
        {/* Table */}
        <div className="rounded-xl border border-v-border overflow-hidden">
            {[...Array(6)].map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
    </div>
);

/* ─── Settings / Roles ───────────────────────────────────────────────────────── */

export const RolesPageSkeleton = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-v-border p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {[...Array(6)].map((_, j) => <Skeleton key={j} className="h-6 w-24 rounded-full" />)}
                </div>
            </div>
        ))}
    </div>
);

/* ─── Settings / Audit Log ───────────────────────────────────────────────────── */

export const AuditLogSkeleton = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="rounded-xl border border-v-border overflow-hidden">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-v-border">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                </div>
            ))}
        </div>
    </div>
);

/* ─── User Settings ──────────────────────────────────────────────────────────── */

export const UserSettingsSkeleton = () => (
    <div className="max-w-2xl space-y-8">
        <Skeleton className="h-7 w-40" />
        {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-v-border p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
        ))}
    </div>
);

/* ─── Meetings ───────────────────────────────────────────────────────────────── */

export const MeetingCardSkeleton = () => (
    <div className="rounded-xl border border-v-border bg-v-primary p-5 space-y-3">
        <div className="flex justify-between items-start">
            <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-6 w-6 rounded-full" />)}
            <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
    </div>
);

export const GlobalMeetingsSkeleton = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <MeetingCardSkeleton key={i} />)}
        </div>
    </div>
);

/* ─── Project Settings ───────────────────────────────────────────────────────── */

export const ProjectSettingsSkeleton = () => (
    <div className="max-w-2xl space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="rounded-xl border border-v-border p-6 space-y-5">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            ))}
            <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="rounded-xl border border-red-200 p-6 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
    </div>
);

/* ─── Workload ────────────────────────────────────────────────────────────────── */

export const WorkloadRowSkeleton = () => (
    <div className="flex items-center gap-4 py-3 border-b border-v-border">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <div className="flex-1">
            <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <Skeleton className="h-4 w-10" />
    </div>
);

export const WorkloadPageSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        {[...Array(5)].map((_, i) => <WorkloadRowSkeleton key={i} />)}
    </div>
);

/* ─── Card & generic ────────────────────────────────────────────────────────── */

export const CardSkeleton = () => (
    <div className="rounded-xl border border-v-border bg-v-primary p-5 space-y-4">
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

/* ─── Timeline ───────────────────────────────────────────────────────────────── */

export const TimelinePageSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        {/* Header row */}
        <div className="flex gap-2 overflow-x-auto">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded" />)}
        </div>
        {/* Timeline rows */}
        <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32 flex-shrink-0" />
                    <Skeleton
                        className="h-8 rounded-full"
                        style={{ width: `${30 + Math.round(Math.random() * 40)}%`, marginLeft: `${Math.round(Math.random() * 20)}%` }}
                    />
                </div>
            ))}
        </div>
    </div>
);

export default Skeleton;
