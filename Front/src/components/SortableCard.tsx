import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';

interface CardProps {
    id: string;
    title: string;
    description?: string;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    labels?: { label: { color: string, name: string } }[];
}

export const SortableCard: React.FC<CardProps> = ({ id, title, description, onClick, onEdit, onDelete, labels }) => {
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
                className={`bg-white/5 p-4 rounded-xl border border-white/5 hover:border-orange-500/40 cursor-grab active:cursor-grabbing transition-all shadow-sm text-gray-300 group relative ${isDragging ? 'ring-2 ring-orange-500' : ''}`}
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
