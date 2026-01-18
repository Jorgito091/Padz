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

// Types
import { Board, List, Card, LabelData, CommentData, BoardMember } from '../types';

const DashboardPage: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const [view, setView] = useState<'dashboard' | 'board'>('dashboard');
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [boardLoading, setBoardLoading] = useState(false);

    // Creation/Edit States
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [editingBoard, setEditingBoard] = useState<Board | null>(null);
    const [boardForm, setBoardForm] = useState({ title: '', description: '', bgColor: 'from-orange-600 to-orange-500' });
    const [searchTerm, setSearchTerm] = useState('');

    // Profile State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({ name: '', avatar: '' });

    // Lists & Cards States
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newCardTitle, setNewCardTitle] = useState('');

    // Member Management State
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    // DND State
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Edit Card State
    const [editingCard, setEditingCard] = useState<Card | null>(null);



    useEffect(() => {
        if (user) {
            setUserForm({ name: user.name, avatar: user.avatar || '' });
            fetchBoards();
        }
    }, [user]);

    const fetchBoards = async () => {
        try {
            setLoading(true);
            const response = await api.get('/boards');
            setBoards(response.data);
        } catch (error) {
            console.error('Error fetching boards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBoardDetail = async (id: string, updateSelected = true) => {
        try {
            if (updateSelected) setBoardLoading(true);
            const response = await api.get(`/boards/${id}`);
            if (updateSelected) setSelectedBoard(response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching board detail:', error);
            if (updateSelected) setView('dashboard');
        } finally {
            if (updateSelected) setBoardLoading(false);
        }
    };

    const openCreateBoardModal = () => {
        setEditingBoard(null);
        setBoardForm({ title: '', description: '', bgColor: 'from-orange-600 to-orange-500' });
        setIsBoardModalOpen(true);
    };

    const openEditBoardModal = (board: Board) => {
        setEditingBoard(board);
        setBoardForm({
            title: board.title,
            description: board.description || '',
            bgColor: board.bgColor || 'from-orange-600 to-orange-500'
        });
        setIsBoardModalOpen(true);
    };

    const handleSaveBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boardForm.title.trim()) return;

        try {
            if (editingBoard) {
                // Update
                const response = await api.put(`/boards/${editingBoard.id}`, boardForm);
                const updatedBoard = response.data;

                // Update local state
                setBoards(boards.map(b => b.id === updatedBoard.id ? updatedBoard : b));
                if (selectedBoard?.id === updatedBoard.id) {
                    setSelectedBoard({ ...selectedBoard, ...updatedBoard });
                }
            } else {
                // Create
                const response = await api.post('/boards', boardForm);
                await fetchBoards();
            }
            setIsBoardModalOpen(false);
        } catch (error) {
            console.error('Error saving board:', error);
        }
    };

    const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, isOwner: boolean) => {
        e.stopPropagation();
        const action = isOwner ? 'eliminar' : 'salir de';
        if (!window.confirm(`¿Estás seguro de que deseas ${action} este tablero?`)) return;

        try {
            await api.delete(`/boards/${boardId}`);
            setBoards(boards.filter(b => b.id !== boardId));
            if (selectedBoard?.id === boardId) {
                setView('dashboard');
                setSelectedBoard(null);
            }
        } catch (error) {
            console.error('Error deleting board:', error);
        }
    };

    const handleToggleStar = async (e: React.MouseEvent, board: Board) => {
        e.stopPropagation();
        try {
            const response = await api.patch(`/boards/${board.id}/star`);
            setBoards(boards.map(b => b.id === board.id ? { ...b, isStarred: response.data.isStarred } : b));
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.put('/auth/profile', userForm);
            const { user } = response.data;
            updateUser(user);
            setIsProfileModalOpen(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    // List & Card handlers
    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListTitle.trim() || !selectedBoard) return;

        try {
            const response = await api.post('/lists', {
                title: newListTitle,
                boardId: selectedBoard.id,
                order: (selectedBoard.lists?.length || 0) + 1
            });
            setSelectedBoard({
                ...selectedBoard,
                lists: [...(selectedBoard.lists || []), { ...response.data, cards: [] }]
            });
            setNewListTitle('');
            setIsCreatingList(false);
        } catch (error) {
            console.error('Error creating list:', error);
        }
    };

    const handleBoardClick = (board: Board) => {
        setSelectedBoard(board);
        setView('board');
        fetchBoardDetail(board.id);
    };

    const handleCreateCard = async (listId: string) => {
        if (!newCardTitle.trim() || !selectedBoard) return;

        try {
            const list = selectedBoard.lists?.find(l => l.id === listId);
            const response = await api.post('/cards', {
                title: newCardTitle,
                listId,
                order: (list?.cards?.length || 0) + 1
            });

            const updatedLists = selectedBoard.lists?.map(l => {
                if (l.id === listId) {
                    return { ...l, cards: [...l.cards, response.data] };
                }
                return l;
            });

            setSelectedBoard({ ...selectedBoard, lists: updatedLists });
            setNewCardTitle('');
            setActiveListId(null);
        } catch (error) {
            console.error('Error creating card:', error);
        }
    };

    const handleDeleteCard = async (cardId: string, listId: string) => {
        if (!selectedBoard) return;

        // Optimistic update
        const updatedLists = selectedBoard.lists?.map(l => {
            if (l.id === listId) {
                return { ...l, cards: l.cards.filter(c => c.id !== cardId) };
            }
            return l;
        });
        setSelectedBoard({ ...selectedBoard, lists: updatedLists });

        try {
            await api.delete(`/cards/${cardId}`);
        } catch (error) {
            console.error('Error deleting card:', error);
            fetchBoardDetail(selectedBoard.id);
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (!selectedBoard) return;

        // Optimistic update
        const updatedLists = selectedBoard.lists?.filter(l => l.id !== listId);
        setSelectedBoard({ ...selectedBoard, lists: updatedLists });

        try {
            await api.delete(`/lists/${listId}`);
        } catch (error) {
            console.error('Error deleting list:', error);
            fetchBoardDetail(selectedBoard.id);
        }
    };

    const openEditModal = (card: Card) => {
        setEditingCard(card);
    };

    // DND Logic
    const findContainer = (id: string) => {
        if (!selectedBoard?.lists) return null;
        if (selectedBoard.lists.find(l => l.id === id)) return id;
        return selectedBoard.lists.find(l => l.cards.some(c => c.id === id))?.id;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId || !selectedBoard?.lists) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setSelectedBoard((prev) => {
            if (!prev || !prev.lists) return prev;

            const activeListIndex = prev.lists.findIndex(l => l.id === activeContainer);
            const overListIndex = prev.lists.findIndex(l => l.id === overContainer);

            return {
                ...prev,
                lists: prev.lists.map((list, index) => {
                    if (index === activeListIndex) {
                        return { ...list, cards: list.cards.filter(c => c.id !== active.id) };
                    }
                    if (index === overListIndex) {
                        const activeCard = prev.lists![activeListIndex].cards.find(c => c.id === active.id)!;
                        const items = list.cards;
                        const overIndex = items.findIndex((i) => i.id === overId);

                        let newIndex;
                        if (overId in prev.lists!) {
                            newIndex = items.length + 1;
                        } else {
                            const isBelowOverItem =
                                over &&
                                active.rect.current.translated &&
                                active.rect.current.translated.top >
                                over.rect.top + over.rect.height;

                            const modifier = isBelowOverItem ? 1 : 0;
                            newIndex = overIndex >= 0 ? overIndex + modifier : items.length + 1;
                        }

                        return {
                            ...list,
                            cards: [
                                ...list.cards.slice(0, newIndex),
                                activeCard,
                                ...list.cards.slice(newIndex, list.cards.length)
                            ]
                        };
                    }
                    return list;
                })
            };
        });
    };

    const handleBoardDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            setActiveId(null);
            return;
        }

        const oldIndex = boards.findIndex((b) => b.id === active.id);
        const newIndex = boards.findIndex((b) => b.id === over.id);

        const newBoards = arrayMove(boards, oldIndex, newIndex);
        setBoards(newBoards);

        try {
            await api.put('/boards/reorder', {
                boardIds: newBoards.map((b, index) => ({ id: b.id, order: index }))
            });
        } catch (error) {
            console.error('Error reordering boards:', error);
            fetchBoards();
        }
        setActiveId(null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        if (view === 'dashboard') {
            return handleBoardDragEnd(event);
        }
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || !selectedBoard?.lists) {
            setActiveId(null);
            return;
        }

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (activeContainer && overContainer) {
            const activeList = selectedBoard.lists.find(l => l.id === activeContainer);
            const overList = selectedBoard.lists.find(l => l.id === overContainer);

            if (activeList && overList) {
                const activeIndex = activeList.cards.findIndex((i) => i.id === active.id);
                const overIndex = overList.cards.findIndex((i) => i.id === overId);

                let newIndex;
                if (overId === overContainer) {
                    newIndex = overList.cards.length;
                } else {
                    newIndex = overIndex >= 0 ? overIndex : overList.cards.length;
                }

                if (activeContainer === overContainer) {
                    if (activeIndex !== overIndex) {
                        const newCards = arrayMove(activeList.cards, activeIndex, newIndex);

                        const updatedLists = selectedBoard.lists.map(l => {
                            if (l.id === activeContainer) {
                                return { ...l, cards: newCards };
                            }
                            return l;
                        });
                        setSelectedBoard({ ...selectedBoard, lists: updatedLists });

                        newCards.forEach(async (card, index) => {
                            await api.put(`/cards/${card.id}`, {
                                title: card.title,
                                description: card.description,
                                listId: activeContainer,
                                order: index
                            });
                        });
                    }
                } else {
                    const card = overList.cards.find(c => c.id === active.id);
                    if (card) {
                        const newOrder = overList.cards.findIndex(c => c.id === active.id);
                        await api.put(`/cards/${active.id}`, {
                            title: card.title,
                            description: card.description,
                            listId: overContainer,
                            order: newOrder
                        });
                        overList.cards.forEach(async (c, idx) => {
                            if (c.id !== active.id) {
                                await api.put(`/cards/${c.id}`, {
                                    title: c.title,
                                    description: c.description,
                                    listId: overContainer,
                                    order: idx
                                });
                            }
                        });
                    }
                }
            }
        }
        setActiveId(null);
    };


    const colorOptions = [
        'from-orange-600 to-orange-500',
        'from-blue-600 to-blue-500',
        'from-emerald-600 to-emerald-500',
        'from-purple-600 to-purple-500',
        'from-pink-600 to-pink-500',
        'from-zinc-800 to-zinc-900', // Neutral/Dark
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            {/* Background blobs based on selected board color if active, else default orange */}
            <div className={`fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${view === 'board' && selectedBoard?.bgColor ? `bg-gradient-to-br ${selectedBoard.bgColor} opacity-20` : 'bg-orange-600/5'}`} />
            <div className={`fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${view === 'board' && selectedBoard?.bgColor ? `bg-gradient-to-tl ${selectedBoard.bgColor} opacity-20` : 'bg-orange-600/5'}`} />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 flex justify-between items-center px-8 py-4 mb-8">
                <div className="flex items-center gap-8">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setView('dashboard')}
                    >
                        <Logo size={32} />
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent group-hover:from-orange-400 group-hover:to-orange-300 transition-all">
                            Padz
                        </span>
                    </div>
                    {view === 'dashboard' && (
                        <div className="hidden md:flex gap-4">
                            <button
                                onClick={openCreateBoardModal}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-500 shadow-lg shadow-orange-950/20 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Crear Tablero
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-white">{user?.name}</span>
                    </div>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="group relative"
                        title="Configuración de usuario"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-orange-500/50 transition-all shadow-lg">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-orange-400">
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
                                onDeleteBoard={handleDeleteBoard}
                                onToggleStar={handleToggleStar}
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
                                <BoardHeader
                                    board={selectedBoard}
                                    onBack={() => setView('dashboard')}
                                    onMembersClick={() => setIsMembersModalOpen(true)}
                                    onSettingsClick={() => openEditBoardModal(selectedBoard)}
                                />
                            )}

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCorners}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="flex gap-6 overflow-x-auto pb-6 items-start scrollbar-hide min-h-[500px]">
                                    {boardLoading ? (
                                        [1, 2, 3].map(n => (
                                            <div key={n} className="min-w-[320px] h-64 rounded-2xl bg-white/5 animate-pulse" />
                                        ))
                                    ) : (
                                        <>
                                            {selectedBoard?.lists?.map((list) => (
                                                <div key={list.id} className="min-w-[320px] max-w-[320px] backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-2xl">
                                                    <div className="flex justify-between items-center mb-5 px-1 text-orange-400 group/list-header">
                                                        <h3 className="font-bold uppercase text-xs tracking-widest">{list.title}</h3>
                                                        <div className="flex gap-1 items-center">
                                                            <button
                                                                onClick={() => handleDeleteList(list.id)}
                                                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-all opacity-0 group-hover/list-header:opacity-100"
                                                                title="Eliminar lista"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setActiveListId(list.id); setNewCardTitle(''); }}
                                                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
                                                                <Plus size={18} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <SortableContext
                                                        id={list.id}
                                                        items={list.cards}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-3 min-h-[10px]">
                                                            {list.cards.map((card) => (
                                                                <SortableCard
                                                                    key={card.id}
                                                                    id={card.id}
                                                                    title={card.title}
                                                                    description={card.description}
                                                                    onEdit={() => openEditModal(card)}
                                                                    onDelete={() => handleDeleteCard(card.id, list.id)}
                                                                    labels={card.labels}
                                                                    dueDate={card.dueDate}
                                                                    isDone={card.isDone}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>

                                                    {activeListId === list.id ? (
                                                        <div className="mt-4 space-y-2">
                                                            <textarea
                                                                autoFocus
                                                                value={newCardTitle}
                                                                onChange={(e) => setNewCardTitle(e.target.value)}
                                                                className="w-full bg-white/5 border border-orange-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none"
                                                                placeholder="¿Qué hay que hacer?"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleCreateCard(list.id);
                                                                    }
                                                                }}
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleCreateCard(list.id)}
                                                                    className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold"
                                                                >
                                                                    Añadir
                                                                </button>
                                                                <button
                                                                    onClick={() => setActiveListId(null)}
                                                                    className="px-3 py-2 bg-white/5 rounded-lg text-gray-400"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setActiveListId(list.id);
                                                                setNewCardTitle('');
                                                            }}
                                                            className="w-full mt-5 py-2.5 px-3 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <Plus size={16} /> Añadir tarjeta
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            {isCreatingList ? (
                                                <form onSubmit={handleCreateList} className="min-w-[320px] backdrop-blur-xl bg-white/[0.05] border border-orange-500/50 rounded-2xl p-4 shadow-2xl">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={newListTitle}
                                                        onChange={(e) => setNewListTitle(e.target.value)}
                                                        placeholder="Nombre de la lista..."
                                                        className="w-full bg-transparent border-none focus:ring-0 text-white font-bold mb-4"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button type="submit" className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold">Crear lista</button>
                                                        <button onClick={() => setIsCreatingList(false)} className="px-3 py-2 bg-white/5 rounded-lg text-gray-400"><X size={18} /></button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => setIsCreatingList(true)}
                                                    className="min-w-[320px] backdrop-blur-xl bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-5 text-left font-semibold text-gray-400 hover:text-white transition-all border-dashed border-2 border-white/10 flex items-center gap-3"
                                                >
                                                    <Plus size={20} /> Añadir lista
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                <DragOverlay>
                                    {activeId ? (
                                        <div className="bg-white/10 p-4 rounded-xl border border-orange-500 ring-2 ring-orange-500/50 shadow-2xl text-white rotate-3 cursor-grabbing backdrop-blur-lg">
                                            {selectedBoard?.lists?.flatMap(l => l.cards).find(c => c.id === activeId)?.title}
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Card Detail Modal */}
                {editingCard && selectedBoard && (
                    <CardDetailModal
                        card={editingCard}
                        board={selectedBoard}
                        user={user}
                        onClose={() => setEditingCard(null)}
                        onUpdate={() => fetchBoardDetail(selectedBoard.id)}
                    />
                )}

                {/* Create/Edit Board Modal */}
                {isBoardModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${boardForm.bgColor} opacity-5`} />

                            <h2 className="text-xl font-bold mb-4 relative z-10">{editingBoard ? 'Editar Tablero' : 'Nuevo Tablero'}</h2>
                            <form onSubmit={handleSaveBoard} className="space-y-4 relative z-10">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={boardForm.title}
                                        onChange={(e) => setBoardForm({ ...boardForm, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                        placeholder="Ej: Proyecto Website"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Descripción (Opcional)</label>
                                    <textarea
                                        value={boardForm.description}
                                        onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 h-24 resize-none"
                                        placeholder="¿De qué trata este tablero?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Color de Fondo</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setBoardForm({ ...boardForm, bgColor: color })}
                                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} transition-all ${boardForm.bgColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsBoardModalOpen(false)}
                                        className="px-4 py-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-orange-900/20"
                                    >
                                        {editingBoard ? 'Guardar Cambios' : 'Crear Tablero'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Profile Modal */}
                {isProfileModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <UserCog className="text-orange-500" /> Perfil de Usuario
                            </h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={userForm.name}
                                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL (Opcional)</label>
                                    <input
                                        type="text"
                                        value={userForm.avatar}
                                        onChange={(e) => setUserForm({ ...userForm, avatar: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsProfileModalOpen(false)}
                                        className="px-4 py-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-orange-900/20"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                                <div className="border-t border-white/10 pt-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                                    >
                                        <LogOut size={18} /> Cerrar Sesión
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Members Modal */}
                <AnimatePresence>
                    {isMembersModalOpen && selectedBoard && (
                        <MembersModal
                            board={selectedBoard}
                            user={user}
                            onClose={() => setIsMembersModalOpen(false)}
                            onUpdate={() => fetchBoardDetail(selectedBoard.id)}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DashboardPage;
