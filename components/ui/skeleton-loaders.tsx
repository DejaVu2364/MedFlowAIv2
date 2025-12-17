import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div
            className={cn(
                "animate-pulse bg-slate-200 dark:bg-slate-700 rounded",
                className
            )}
        />
    );
};

// Patient List Item Skeleton
export const PatientListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
};

// Dashboard Card Skeleton
export const DashboardCardSkeleton: React.FC = () => {
    return (
        <div className="p-4 bg-white rounded-lg border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
    );
};

// Clinical File Section Skeleton
export const ClinicalSectionSkeleton: React.FC = () => {
    return (
        <div className="p-4 bg-white rounded-lg border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
            </div>
        </div>
    );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
    return (
        <div className="flex items-center gap-4 p-3 border-b border-slate-100">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
    );
};

export default Skeleton;
