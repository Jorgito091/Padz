import React from 'react';
import { Plus, Star, Search, Trash2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Board } from '../../types';
import { SortableBoard } from '../SortableBoard';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

interface BoardGridProps {
    boards: Board[];
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onCreateBoard: () => void;
    onEditBoard: (board: Board) => void;
    onDeleteBoard: (e: React.MouseEvent, id: string, isOwner: boolean) => void;
    onToggleStar: (e: React.MouseEvent, board: Board) => void;
    onBoardClick: (board: Board) => void;
    activeId: string | null;
    sensors: any;
    onDragStart: (event: any) => void;
    onDragEnd: (event: any) => void;
    user: any;
}

export const BoardGrid: React.FC<BoardGridProps> = ({
    boards,
    searchTerm,
    onSearchChange,
    onCreateBoard,
    onEditBoard,
    onDeleteBoard,
    onToggleStar,
    onBoardClick,
    activeId,
    sensors,
    onDragStart,
    onDragEnd,
    user
}) => {
    const filteredBoards = boards.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const starredBoards = filteredBoards.filter(b => b.isStarred);
    const otherBoards = filteredBoards.filter(b => !b.isStarred);

    const renderBoardSection = (title: string, boardsList: Board[], icon?: React.ReactNode) => {
        if (boardsList.length === 0) return null;
        return (
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-6 ml-2">
                    {icon}
                    <h2 className="text-xl font-semibold text-[#111111] tracking-tight">{title}</h2>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs text-[#6b6b6f] font-mono border border-black/10">{boardsList.length}</span>
                </div>
                <SortableContext items={boardsList.map(b => b.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {boardsList.map((board) => (
                            <SortableBoard
                                key={board.id}
                                board={board}
                                onClick={() => onBoardClick(board)}
                                onEdit={(e) => { e.stopPropagation(); onEditBoard(board); }}
                                onDelete={(e) => onDeleteBoard(e, board.id, board.ownerId === user?.id)}
                                onToggleStar={(e) => onToggleStar(e, board)}
                                isOwner={board.ownerId === user?.id}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-semibold text-[#111111] mb-2 tracking-tight">Tus Tableros</h1>
                    <p className="text-[#6b6b6f] font-medium">Gestiona tus proyectos y equipos en un solo lugar.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8b8f] group-focus-within:text-[#111111] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar tableros..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-white border border-black/10 rounded-2xl py-3 pl-12 pr-4 text-[#111111] focus:outline-none focus:border-black/20 transition-colors placeholder:text-[#8b8b8f]"
                        />
                    </div>
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                {renderBoardSection("Destacados", starredBoards, <Star className="text-orange-500 fill-orange-500" size={20} />)}
                {renderBoardSection("Todos los Tableros", otherBoards)}

                {filteredBoards.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 bg-white rounded-3xl border border-dashed border-black/10">
                        <p className="text-[#6b6b6f] text-lg font-medium">No se encontraron tableros</p>
                        <button onClick={onCreateBoard} className="mt-4 text-[#111111] font-medium hover:underline transition-colors underline-offset-4">Crear uno nuevo</button>
                    </motion.div>
                )}

                <DragOverlay>
                    {activeId ? (
                        <div className="w-80 h-48 bg-white rounded-3xl border border-black/10 rotate-1" />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
