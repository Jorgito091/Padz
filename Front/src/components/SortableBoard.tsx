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

    const defaultBoardColor = '#f43f5e';
    const isHexColor = (value?: string) => Boolean(value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value));

    const hexToRgb = (hex: string) => {
        const normalized = hex.replace('#', '');
        const expanded = normalized.length === 3
            ? normalized.split('').map(char => char + char).join('')
            : normalized;
        const value = parseInt(expanded, 16);
        return {
            red: (value >> 16) & 255,
            green: (value >> 8) & 255,
            blue: value & 255,
        };
    };

    const isLightColor = (value: string) => {
        if (!isHexColor(value)) {
            return value === 'bg-amber-400' || value === 'bg-lime-500' || value === 'bg-white';
        }

        const { red, green, blue } = hexToRgb(value);
        const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
        return luminance > 0.65;
    };

    const boardColor = board.bgColor || defaultBoardColor;
    const boardTextClass = isLightColor(boardColor) ? 'text-[#111111]' : 'text-white';
    const boardMutedTextClass = isLightColor(boardColor) ? 'text-[#6b6b6f]' : 'text-white/80';
    const boardPanelClass = isHexColor(boardColor)
        ? ''
        : boardColor;
    const boardPanelStyle = isHexColor(boardColor)
        ? { backgroundColor: boardColor }
        : undefined;
    const boardAccentStyle = isHexColor(boardColor)
        ? { backgroundColor: boardColor }
        : undefined;
    const boardColorClass = isHexColor(boardColor)
        ? ''
        : boardColor;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <motion.div
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={onClick}
                className={`h-40 p-6 ${boardPanelClass} border border-black/10 hover:border-black/20 rounded-2xl cursor-pointer flex flex-col justify-end transition-colors group overflow-hidden relative`}
                style={boardPanelStyle}
            >
                <div className={`absolute inset-x-0 top-0 h-3 ${boardColorClass}`} style={boardAccentStyle} />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />

                {/* Star Button */}
                <button
                    onClick={onToggleStar}
                    className={`absolute top-4 left-4 p-2 rounded-lg transition-colors z-20 shadow-sm ring-1 ring-white/20 ${isLightColor(boardColor) ? 'text-[#111111]' : 'text-white'} hover:brightness-110`}
                    style={boardAccentStyle}
                >
                    <Star size={16} className={board.isStarred ? "fill-current" : ""} />
                </button>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-auto pl-8">
                        <h3 className={`text-xl font-semibold transition-colors uppercase tracking-tight line-clamp-2 pr-8 ${boardTextClass}`}>{board.title}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={onDelete}
                                className={`p-2 hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ring-1 ring-white/20 ${boardTextClass}`}
                                title={isOwner ? "Eliminar tablero" : "Salir del tablero"}
                            >
                                {isOwner ? <Trash2 size={16} /> : <LogOut size={16} />}
                            </button>
                        </div>
                    </div>
                    {board.description && (
                        <p className={`text-xs mt-1 line-clamp-2 ${boardMutedTextClass}`}>{board.description}</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
