import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Clock, CheckCircle2, ListChecks } from 'lucide-react';
import { ChecklistData } from '../types';
import { getChecklistProgress } from './card/CardChecklists';

interface CardProps {
    id: string;
    title: string;
    description?: string;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    labels?: { label: { color: string, name: string } }[];
    assignees?: { user: { id: string, name: string, avatar?: string } }[];
    dueDate?: string;
    isDone?: boolean;
    checklists?: ChecklistData[];
}

export const SortableCard: React.FC<CardProps> = ({ id, title, description, onClick, onEdit, onDelete, labels, assignees, dueDate, isDone, checklists }) => {
    const checklistProgress = getChecklistProgress(checklists);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <motion.div
                layoutId={id}
                onClick={onClick}
                className={`bg-white/5 p-4 rounded-xl border border-white/5 hover:border-orange-500/40 cursor-pointer active:cursor-grabbing transition-all shadow-sm hover:shadow-lg hover:shadow-orange-500/5 text-gray-300 group relative ${isDragging ? 'ring-2 ring-orange-500' : ''}`}
            >
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                        {labels && labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {labels.map((l, i) => (
                                    <div
                                        key={i}
                                        title={l.label.name}
                                        className="h-1.5 w-8 rounded-full shadow-sm"
                                        style={{ backgroundColor: l.label.color }}
                                    />
                                ))}
                            </div>
                        )}
                        <div className="font-medium text-white">{title}</div>
                        {description && (
                            <div className="text-xs text-gray-500 mt-2 line-clamp-2">{description}</div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                {checklistProgress && (
                                    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${
                                        checklistProgress.done === checklistProgress.total
                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                            : 'bg-white/5 text-gray-400 border-white/10'
                                    }`}>
                                        <ListChecks size={10} />
                                        <span>{checklistProgress.done}/{checklistProgress.total}</span>
                                    </div>
                                )}
                                {dueDate && (
                                    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm transition-all ${isDone
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : new Date(dueDate) < new Date()
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : new Date(dueDate).getTime() - new Date().getTime() < 86400000
                                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                : 'bg-white/5 text-gray-400 border border-white/10'
                                        }`}>
                                        {isDone ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                        <span>{new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex -space-x-1.5">
                                {assignees?.map((a, i) => (
                                    <div 
                                        key={i} 
                                        title={a.user.name}
                                        className="w-5 h-5 rounded-full border border-[#1a1a1c] bg-white/10 overflow-hidden shadow-sm"
                                    >
                                        {a.user.avatar ? (
                                            <img src={a.user.avatar} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-gray-400">
                                                {a.user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!isDragging && (onEdit || onDelete) && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

