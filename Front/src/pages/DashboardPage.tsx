import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, ArrowLeft, LogOut, Loader2, X, Send, Trash2, Settings, UserCog, Star, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import api from '../services/api';
import { SortableCard } from '../components/SortableCard';
import { SortableBoard } from '../components/SortableBoard';

// Modular Components
import { BoardGrid } from '../components/board/BoardGrid';
import { BoardHeader } from '../components/board/BoardHeader';
import { CardDetailModal } from '../components/modals/CardDetailModal';
import { MembersModal } from '../components/modals/MembersModal';
import { ProfileModal } from '../components/modals/ProfileModal';
import { CreateBoardModal } from '../components/modals/CreateBoardModal';
import { BoardView } from '../components/board/BoardView';

import { NotificationPanel } from '../components/NotificationPanel';

// Hooks
import { useBoardData } from '../hooks/useBoardData';

// Types
import { Board, List, Card, LabelData, CommentData, BoardMember } from '../types';

const DashboardPage: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const {
        view,
        setView,
        boards,
        selectedBoard,
        setSelectedBoard,
        loading,
        boardLoading,
        activeId,
        sensors,
        fetchBoardDetail,
        handleSaveBoard,
        handleDeleteBoard,
        handleToggleStar,
        handleCreateList,
        handleDeleteList,
        handleCreateCard,
        handleDeleteCard,
        handleDragStart,
        handleDragOver,
        handleDragEnd
    } = useBoardData(user);

    // Local UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [editingBoard, setEditingBoard] = useState<Board | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    const openCreateBoardModal = () => {
        setEditingBoard(null);
        setIsBoardModalOpen(true);
    };

    const openEditBoardModal = (board: Board) => {
        setEditingBoard(board);
        setIsBoardModalOpen(true);
    };

    const handleSaveBoardSubmit = async (boardForm: { title: string; description: string; bgColor: string }) => {
        const success = await handleSaveBoard(boardForm, editingBoard);
        if (success) setIsBoardModalOpen(false);
    };

    const handleBoardClick = (board: Board) => {
        setSelectedBoard(board);
        setView('board');
        fetchBoardDetail(board.id);
    };

    // Wrappers for BoardGrid which passes MouseEvents
    const onDeleteBoardWrapper = (e: React.MouseEvent, id: string, isOwner: boolean) => {
        e.stopPropagation();
        handleDeleteBoard(id, isOwner);
    };

    const onToggleStarWrapper = (e: React.MouseEvent, board: Board) => {
        e.stopPropagation();
        handleToggleStar(board.id);
    };

    return (
        <div className="min-h-screen bg-[#f5f2ec] text-[#111111]">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[#f5f2ec]/95 backdrop-blur-sm border-b border-black/10 flex justify-between items-center px-8 py-4 mb-8">
                <div className="flex items-center gap-8">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setView('dashboard')}
                    >
                        <Logo size={32} />
                        <span className="text-2xl font-semibold text-[#111111] group-hover:text-black transition-colors">
                            Padz
                        </span>
                    </div>
                    {view === 'dashboard' && (
                        <div className="hidden md:flex gap-4">
                            <button
                                onClick={openCreateBoardModal}
                                className="px-4 py-2 bg-[#111111] text-white rounded-lg font-medium hover:bg-black transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Crear Tablero
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <NotificationPanel />
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-[#111111]">{user?.name}</span>
                    </div>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="group relative"
                        title="Configuración de usuario"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 group-hover:border-black/30 transition-colors bg-white">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-white flex items-center justify-center text-[#6b6b6f] group-hover:text-[#111111]">
                                    <UserCog size={20} />
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pb-12 relative z-10">
                <AnimatePresence mode="wait">
                    {view === 'dashboard' ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <BoardGrid
                                boards={boards}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onCreateBoard={openCreateBoardModal}
                                onEditBoard={openEditBoardModal}
                                onDeleteBoard={onDeleteBoardWrapper}
                                onToggleStar={onToggleStarWrapper}
                                onBoardClick={handleBoardClick}
                                activeId={activeId}
                                sensors={sensors}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                user={user}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="board"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {selectedBoard && (
                                <>
                                    <BoardHeader
                                        board={selectedBoard}
                                        onBack={() => setView('dashboard')}
                                        onMembersClick={() => setIsMembersModalOpen(true)}
                                        onSettingsClick={() => openEditBoardModal(selectedBoard)}
                                    />
                                    <BoardView
                                        board={selectedBoard}
                                        boardLoading={boardLoading}
                                        activeId={activeId}
                                        sensors={sensors}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragEnd={handleDragEnd}
                                        onCreateList={handleCreateList}
                                        onDeleteList={handleDeleteList}
                                        onCreateCard={handleCreateCard}
                                        onDeleteCard={handleDeleteCard}
                                        onEditCard={setEditingCard}
                                    />
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modals */}
                <AnimatePresence>
                    {isProfileModalOpen && (
                        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
                    )}
                    {isBoardModalOpen && (
                        <CreateBoardModal
                            editingBoard={editingBoard}
                            onClose={() => setIsBoardModalOpen(false)}
                            onSave={handleSaveBoardSubmit}
                        />
                    )}
                    {isMembersModalOpen && selectedBoard && (
                        <MembersModal
                            board={selectedBoard}
                            user={user}
                            onClose={() => setIsMembersModalOpen(false)}
                            onUpdate={() => fetchBoardDetail(selectedBoard.id)}
                        />
                    )}
                    {editingCard && selectedBoard && (
                        <CardDetailModal
                            card={editingCard}
                            board={selectedBoard}
                            user={user}
                            onClose={() => setEditingCard(null)}
                            onUpdate={() => fetchBoardDetail(selectedBoard.id)}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DashboardPage;
