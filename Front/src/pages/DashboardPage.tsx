import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, ArrowLeft, LogOut, Loader2, X, Send } from 'lucide-react';
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
} from '@dnd-kit/sortable';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import api from '../services/api';
import { SortableCard } from '../components/SortableCard';

// Types
interface Card {
    id: string;
    title: string;
    description?: string;
    order: number;
    listId: string;
}
interface List {
    id: string;
    title: string;
    order: number;
    cards: Card[];
}
interface Board {
    id: string;
    title: string;
    bgImage?: string;
    lists?: List[];
}

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [view, setView] = useState<'dashboard' | 'board'>('dashboard');
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [boardLoading, setBoardLoading] = useState(false);

    // Creation States
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newCardTitle, setNewCardTitle] = useState('');

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

    useEffect(() => {
        fetchBoards();
    }, []);

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

    const fetchBoardDetail = async (id: string) => {
        try {
            setBoardLoading(true);
            const response = await api.get(`/boards/${id}`);
            setSelectedBoard(response.data);
        } catch (error) {
            console.error('Error fetching board detail:', error);
            setView('dashboard');
        } finally {
            setBoardLoading(false);
        }
    };

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardTitle.trim()) return;

        try {
            const response = await api.post('/boards', { title: newBoardTitle });
            setBoards([...boards, response.data]);
            setNewBoardTitle('');
            setIsCreatingBoard(false);
            handleBoardClick(response.data);
        } catch (error) {
            console.error('Error creating board:', error);
        }
    };

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

    const handleBoardClick = (board: Board) => {
        setSelectedBoard(board);
        setView('board');
        fetchBoardDetail(board.id);
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
                        // Just push for simple drag over, refined positioning happens in DragEnd or more complex DragOver logic
                        // Here we are just mocking the visual movement for simplicity in this step.
                        // Ideally we find the insertion index.

                        // NOTE: For simplicity, we just add to the list. 
                        // Real logic for exact positioning requires calculating indexes relative to overId.
                        // If overId is a card, we insert near it. If it's the container, we insert at end (or beginning).

                        // We will rely on DragEnd for the persistent state, DragOver is just visual.
                        // Actually DND Kit recommends updating state during DragOver for sorting between containers.

                        const items = list.cards;
                        const activeItems = prev.lists![activeListIndex].cards;
                        const activeIndex = activeItems.findIndex((i) => i.id === active.id);
                        const overIndex = items.findIndex((i) => i.id === overId);

                        let newIndex;
                        if (overId in prev.lists!) {
                            // We're over a container
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

    const handleDragEnd = async (event: DragEndEvent) => {
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
                    // Dropped on a container
                    newIndex = overList.cards.length;
                } else {
                    newIndex = overIndex >= 0 ? overIndex : overList.cards.length;
                }

                // If same container, just reorder using arrayMove
                if (activeContainer === overContainer) {
                    if (activeIndex !== overIndex) {
                        const newCards = arrayMove(activeList.cards, activeIndex, newIndex);

                        // Optimistic Update
                        const updatedLists = selectedBoard.lists.map(l => {
                            if (l.id === activeContainer) {
                                return { ...l, cards: newCards };
                            }
                            return l;
                        });
                        setSelectedBoard({ ...selectedBoard, lists: updatedLists });

                        // API Update (Reorder all cards in list to be safe)
                        // In production, we'd throttle this or use specific endpoint
                        newCards.forEach(async (card, index) => {
                            await api.put(`/cards/${card.id}`, {
                                title: card.title, // keep title
                                description: card.description,
                                listId: activeContainer,
                                order: index
                            });
                        });
                    }
                } else {
                    // Moved to different container
                    // The state update in DragOver handles the moving. 
                    // DragEnd just finalizes.
                    // But if we relied only on DragOver, the item is already there.

                    // We need to persist the change to the API.

                    // 1. Find the new list and the card's position.
                    // Since DragOver updated state, the card IS in the overContainer now.

                    const card = overList.cards.find(c => c.id === active.id);
                    if (card) {
                        const newOrder = overList.cards.findIndex(c => c.id === active.id);

                        // Update the card's listId and order
                        await api.put(`/cards/${active.id}`, {
                            title: card.title,
                            description: card.description,
                            listId: overContainer,
                            order: newOrder
                        });

                        // Reorder others if necessary? simpler to just update this one for MVP,
                        // assuming others sort around it on refresh or we update all.
                        // Lets update all in target list to be consistent.
                        overList.cards.forEach(async (c, idx) => {
                            if (c.id !== active.id) { // optimization
                                // Only need to update if order changed significantly
                                // For robustness, we might just update the moved one and hope 'order' doesn't collide too much
                                // or update all.
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


    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            {/* Background blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />

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
                                onClick={() => setIsCreatingBoard(true)}
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
                        <span className="text-xs text-gray-400">{user?.email}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all"
                        title="Cerrar sesión"
                    >
                        <LogOut size={20} />
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
                            <div className="flex items-center gap-3 mb-8">
                                <LayoutGrid className="text-orange-500" />
                                <h1 className="text-3xl font-bold">Mis Tableros</h1>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {loading ? (
                                    [1, 2, 3, 4].map((n) => (
                                        <div key={n} className="h-40 rounded-2xl bg-white/5 border border-white/10 shadow-xl animate-pulse opacity-50" />
                                    ))
                                ) : (
                                    <>
                                        {boards.map((board) => (
                                            <motion.div
                                                key={board.id}
                                                whileHover={{ scale: 1.02, y: -5 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleBoardClick(board)}
                                                className="h-40 p-6 backdrop-blur-xl bg-white/5 border border-white/5 hover:border-orange-500/30 rounded-2xl cursor-pointer flex flex-col justify-end shadow-xl transition-all group overflow-hidden relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-orange-600/20 transition-all" />
                                                <h3 className="relative z-10 text-xl font-bold text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">{board.title}</h3>
                                            </motion.div>
                                        ))}
                                        {isCreatingBoard ? (
                                            <form onSubmit={handleCreateBoard} className="h-40 p-6 backdrop-blur-xl bg-white/10 border border-orange-500/50 rounded-2xl shadow-xl flex flex-col justify-between">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={newBoardTitle}
                                                    onChange={(e) => setNewBoardTitle(e.target.value)}
                                                    placeholder="Título del tablero..."
                                                    className="bg-transparent border-none focus:ring-0 text-white font-bold p-0 text-lg placeholder:text-gray-500"
                                                />
                                                <div className="flex gap-2">
                                                    <button type="submit" className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold">Crear</button>
                                                    <button onClick={() => setIsCreatingBoard(false)} className="px-3 py-2 bg-white/5 rounded-lg text-gray-400"><X size={18} /></button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div
                                                onClick={() => setIsCreatingBoard(true)}
                                                className="h-40 p-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-orange-500/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all">
                                                    <Plus />
                                                </div>
                                                <span className="font-medium">Nuevo Tablero</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="board"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold">{selectedBoard?.title}</h1>
                                    <p className="text-sm text-gray-400">Panel de control</p>
                                </div>
                            </div>

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
                                                    <div className="flex justify-between items-center mb-5 px-1 text-orange-400">
                                                        <h3 className="font-bold uppercase text-xs tracking-widest">{list.title}</h3>
                                                        <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"><Plus size={18} /></button>
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
                                            {/* We need to find the card data to render here. For simplicity we just show a placeholder or look it up */}
                                            {selectedBoard?.lists?.flatMap(l => l.cards).find(c => c.id === activeId)?.title}
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DashboardPage;
