import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

interface CardProps {
    id: string;
    title: string;
    description?: string;
    onClick?: () => void;
}

export const SortableCard: React.FC<CardProps> = ({ id, title, description, onClick }) => {
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
                <div>{title}</div>
                {description && (
                    <div className="text-xs text-gray-500 mt-2 line-clamp-2">{description}</div>
                )}
            </motion.div>
        </div>
    );
};
