import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Star, Trash2, LogOut } from 'lucide-react';
import { Board } from '../types';

interface Props {
    board: Board;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onToggleStar: (e: React.MouseEvent) => void;
    isOwner: boolean;
}

export const SortableBoard: React.FC<Props> = ({
    board,
    onClick,
    onEdit,
    onDelete,
    onToggleStar,
    isOwner
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: board.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className={`h-40 p-6 backdrop-blur-xl bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer flex flex-col justify-end shadow-xl transition-all group overflow-hidden relative`}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${board.bgColor || 'from-orange-600/20 to-orange-900/20'} opacity-40 group-hover:opacity-60 transition-all`} />

                {/* Star Button */}
                <button
                    onClick={onToggleStar}
                    className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 rounded-lg text-orange-500 transition-all z-20"
                >
                    <Star size={16} className={board.isStarred ? "fill-current" : ""} />
                </button>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-auto pl-8">
                        <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors uppercase tracking-tight shadow-sm line-clamp-2 pr-8">{board.title}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={onDelete}
                                className="p-2 hover:bg-black/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title={isOwner ? "Eliminar tablero" : "Salir del tablero"}
                            >
                                {isOwner ? <Trash2 size={16} /> : <LogOut size={16} />}
                            </button>
                        </div>
                    </div>
                    {board.description && (
                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">{board.description}</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
