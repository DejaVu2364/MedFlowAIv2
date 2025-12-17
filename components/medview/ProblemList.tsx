import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ActiveProblem } from '../../types';
import { cn } from '../../lib/utils';

interface ProblemListProps {
    problems: ActiveProblem[];
    onAdd: () => void;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    className?: string;
}

export const ProblemList: React.FC<ProblemListProps> = ({ problems, onAdd, onEdit, onRemove, className }) => {
    return (
        <Card className={cn("", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Active Problems</CardTitle>
                <Button variant="outline" size="sm" onClick={onAdd} className="h-8 w-8 p-0">
                    <PlusIcon className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {problems.map((problem) => (
                    <div key={problem.id} className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors group">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{problem.description}</span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] px-1.5 py-0 h-4 font-normal",
                                        {
                                            "bg-red-50 text-red-700 border-red-200": problem.status === 'urgent',
                                            "bg-yellow-50 text-yellow-700 border-yellow-200": problem.status === 'monitor',
                                            "bg-green-50 text-green-700 border-green-200": problem.status === 'improving'
                                        }[problem.status]
                                    )}
                                >
                                    {problem.status}
                                </Badge>
                            </div>
                            {problem.notes && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{problem.notes}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(problem.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                                <PencilIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onRemove(problem.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                                <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
                {problems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active problems recorded.</p>
                )}
            </CardContent>
        </Card>
    );
};
