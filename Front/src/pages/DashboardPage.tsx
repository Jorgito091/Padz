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

// Types
interface Card {
    id: string;
    title: string;
    description?: string;
    order: number;
    listId: string;
    comments?: CommentData[];
}
interface CommentData {
    id: string;
    text: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
}
interface List {
    id: string;
    title: string;
    order: number;
    cards: Card[];
}
interface BoardMember {
    id: string;
    role: string;
    userId: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
        email?: string;
    };
}
interface Board {
    id: string;
    title: string;
    description?: string;
    bgImage?: string;
    bgColor?: string;
    lists?: List[];
    ownerId: string;
    owner?: {
        name: string;
        avatar?: string;
    };
    members?: BoardMember[];
    isStarred?: boolean;
    order?: number;
}

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
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

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
    const [editCardTitle, setEditCardTitle] = useState('');
    const [editCardDescription, setEditCardDescription] = useState('');

    // Comments State
    const [cardComments, setCardComments] = useState<CommentData[]>([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);



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
            // Revert on error (optional, for MVP we skip complex revert logic)
            fetchBoardDetail(selectedBoard.id);
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !selectedBoard) return;

        setIsInviting(true);
        try {
            await api.post('/members', {
                boardId: selectedBoard.id,
                email: inviteEmail,
                role: 'MEMBER'
            });
            // Refetch board detail to show new member
            await fetchBoardDetail(selectedBoard.id);
            setInviteEmail('');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al invitar miembro');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberUserId: string) => {
        if (!selectedBoard) return;
        try {
            await api.delete(`/members/${selectedBoard.id}/${memberUserId}`);
            await fetchBoardDetail(selectedBoard.id);
        } catch (error) {
            console.error('Error removing member:', error);
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

    const fetchComments = async (cardId: string) => {
        try {
            const response = await api.get(`/comments/${cardId}`);
            setCardComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim() || !editingCard) return;

        setIsPostingComment(true);
        try {
            const response = await api.post('/comments', {
                cardId: editingCard.id,
                text: newCommentText
            });
            setCardComments([response.data, ...cardComments]);
            setNewCommentText('');
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setIsPostingComment(true);
            setIsPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setCardComments(cardComments.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const openEditModal = (card: Card) => {
        setEditingCard(card);
        setEditCardTitle(card.title);
        setEditCardDescription(card.description || '');
        setCardComments([]);
        fetchComments(card.id);
    };

    const handleUpdateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard || !selectedBoard) return;

        // Optimistic update
        const updatedLists = selectedBoard.lists?.map(l => {
            if (l.cards.some(c => c.id === editingCard.id)) {
                return {
                    ...l,
                    cards: l.cards.map(c =>
                        c.id === editingCard.id
                            ? { ...c, title: editCardTitle, description: editCardDescription }
                            : c
                    )
                };
            }
            return l;
        });
        setSelectedBoard({ ...selectedBoard, lists: updatedLists });
        setEditingCard(null);

        try {
            await api.put(`/cards/${editingCard.id}`, {
                title: editCardTitle,
                description: editCardDescription,
                order: editingCard.order,
                listId: editingCard.listId
            });
            fetchBoardDetail(selectedBoard.id);
        } catch (error) {
            console.error('Error updating card:', error);
            fetchBoardDetail(selectedBoard.id);
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
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <LayoutGrid className="text-orange-500" />
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Mis Tableros</h1>
                                </div>
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar tableros..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map((n) => (
                                        <div key={n} className="h-40 rounded-2xl bg-white/5 border border-white/10 shadow-xl animate-pulse opacity-50" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {/* Starred Boards */}
                                    {boards.filter(b => b.isStarred && b.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-2 mb-6 text-gray-400">
                                                <Star size={16} className="fill-orange-500 text-orange-500" />
                                                <h2 className="text-sm font-bold uppercase tracking-widest">Favoritos</h2>
                                            </div>
                                            <SortableContext items={boards.filter(b => b.isStarred && b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(b => b.id)} strategy={rectSortingStrategy}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {boards.filter(b => b.isStarred && b.title.toLowerCase().includes(searchTerm.toLowerCase())).map((board) => (
                                                        <SortableBoard key={board.id} id={board.id}>
                                                            <motion.div
                                                                whileHover={{ scale: 1.02, y: -5 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => handleBoardClick(board)}
                                                                className={`h-40 p-6 backdrop-blur-xl bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer flex flex-col justify-end shadow-xl transition-all group overflow-hidden relative`}
                                                            >
                                                                <div className={`absolute inset-0 bg-gradient-to-br ${board.bgColor || 'from-orange-600/20 to-orange-900/20'} opacity-40 group-hover:opacity-60 transition-all`} />

                                                                {/* Star Button */}
                                                                <button
                                                                    onClick={(e) => handleToggleStar(e, board)}
                                                                    className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 rounded-lg text-orange-500 transition-all z-20"
                                                                >
                                                                    <Star size={16} className="fill-current" />
                                                                </button>

                                                                <div className="relative z-10 flex flex-col h-full">
                                                                    <div className="flex justify-between items-start mb-auto pl-8">
                                                                        <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors uppercase tracking-tight shadow-sm line-clamp-2 pr-8">{board.title}</h3>
                                                                        <button
                                                                            onClick={(e) => handleDeleteBoard(e, board.id, board.ownerId === user?.id)}
                                                                            className="p-2 hover:bg-black/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                                            title={board.ownerId === user?.id ? "Eliminar tablero" : "Salir del tablero"}
                                                                        >
                                                                            {board.ownerId === user?.id ? <Trash2 size={16} /> : <LogOut size={16} />}
                                                                        </button>
                                                                    </div>
                                                                    {board.description && (
                                                                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">{board.description}</p>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </SortableBoard>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </section>
                                    )}

                                    {/* All Boards */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-6 text-gray-400">
                                            <LayoutGrid size={16} />
                                            <h2 className="text-sm font-bold uppercase tracking-widest">
                                                {boards.some(b => b.isStarred) ? "Resto de Tableros" : "Todos los Tableros"}
                                            </h2>
                                        </div>
                                        <SortableContext items={boards.filter(b => !b.isStarred && b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(b => b.id)} strategy={rectSortingStrategy}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {boards.filter(b => !b.isStarred && b.title.toLowerCase().includes(searchTerm.toLowerCase())).map((board) => (
                                                    <SortableBoard key={board.id} id={board.id}>
                                                        <motion.div
                                                            whileHover={{ scale: 1.02, y: -5 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleBoardClick(board)}
                                                            className={`h-40 p-6 backdrop-blur-xl bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer flex flex-col justify-end shadow-xl transition-all group overflow-hidden relative`}
                                                        >
                                                            <div className={`absolute inset-0 bg-gradient-to-br ${board.bgColor || 'from-orange-600/20 to-orange-900/20'} opacity-40 group-hover:opacity-60 transition-all`} />

                                                            {/* Star Button */}
                                                            <button
                                                                onClick={(e) => handleToggleStar(e, board)}
                                                                className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 rounded-lg text-white/40 hover:text-orange-500 transition-all z-20 opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Star size={16} />
                                                            </button>

                                                            <div className="relative z-10 flex flex-col h-full">
                                                                <div className="flex justify-between items-start mb-auto pl-8">
                                                                    <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors uppercase tracking-tight shadow-sm line-clamp-2 pr-8">{board.title}</h3>
                                                                    <button
                                                                        onClick={(e) => handleDeleteBoard(e, board.id, board.ownerId === user?.id)}
                                                                        className="p-2 hover:bg-black/20 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                                        title={board.ownerId === user?.id ? "Eliminar tablero" : "Salir del tablero"}
                                                                    >
                                                                        {board.ownerId === user?.id ? <Trash2 size={16} /> : <LogOut size={16} />}
                                                                    </button>
                                                                </div>
                                                                {board.description && (
                                                                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">{board.description}</p>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    </SortableBoard>
                                                ))}

                                                <div
                                                    onClick={openCreateBoardModal}
                                                    className="h-40 p-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-orange-500/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white group"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all">
                                                        <Plus />
                                                    </div>
                                                    <span className="font-medium">Nuevo Tablero</span>
                                                </div>
                                            </div>
                                        </SortableContext>
                                    </section>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="board"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Board Header */}
                            <div className="flex items-center gap-4 mb-8 backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="relative z-10 p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-3xl font-bold text-white">{selectedBoard?.title}</h1>

                                        {/* Board Members Avatars */}
                                        <div className="flex -space-x-2 ml-4">
                                            {/* Owner */}
                                            <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1c] overflow-hidden bg-orange-600 flex items-center justify-center text-[10px] font-bold shadow-lg" title={`Dueño: ${selectedBoard?.owner?.name}`}>
                                                {selectedBoard?.owner?.avatar ? (
                                                    <img src={selectedBoard.owner.avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{selectedBoard?.owner?.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            {/* Members */}
                                            {selectedBoard?.members?.map(m => (
                                                <div key={m.id} className="w-8 h-8 rounded-full border-2 border-[#1a1a1c] overflow-hidden bg-zinc-700 flex items-center justify-center text-[10px] font-bold shadow-lg" title={m.user.name}>
                                                    {m.user.avatar ? (
                                                        <img src={m.user.avatar} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{m.user.name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setIsMembersModalOpen(true)}
                                                className="w-8 h-8 rounded-full border-2 border-[#1a1a1c] bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shadow-lg"
                                                title="Invitar miembros"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    {selectedBoard?.description && (
                                        <p className="text-sm text-gray-300 mt-1 max-w-2xl">{selectedBoard.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => openEditBoardModal(selectedBoard!)}
                                    className="relative z-10 p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all ml-auto hover:bg-white/10"
                                    title="Configuración"
                                >
                                    <Settings size={20} />
                                </button>
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
                                                            <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"><Plus size={18} /></button>
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

                {/* Edit Card Modal */}
                {editingCard && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4">Editar Tarjeta</h2>
                            <form onSubmit={handleUpdateCard} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold uppercase tracking-wider">Título de la Tarjeta</label>
                                    <input
                                        type="text"
                                        value={editCardTitle}
                                        onChange={(e) => setEditCardTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all font-medium"
                                        placeholder="Título de la tarjeta"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold uppercase tracking-wider">Descripción</label>
                                    <textarea
                                        value={editCardDescription}
                                        onChange={(e) => setEditCardDescription(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 h-32 resize-none transition-all"
                                        placeholder="Añade una descripción más detallada..."
                                    />
                                </div>

                                {/* Seccion de Comentarios */}
                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Comentarios</h3>

                                    <div className="flex gap-2 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold border border-white/10 flex-shrink-0">
                                            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" /> : user?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={newCommentText}
                                                onChange={(e) => setNewCommentText(e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                                placeholder="Escribe un comentario..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePostComment}
                                                disabled={isPostingComment || !newCommentText.trim()}
                                                className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white disabled:opacity-50 transition-colors"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                        {cardComments.map((comment) => (
                                            <div key={comment.id} className="flex gap-3 group">
                                                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold border border-white/10 flex-shrink-0">
                                                    {comment.user.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover rounded-full" /> : comment.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-white">{comment.user.name}</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                                                        {(comment.user.id === user?.id || selectedBoard?.ownerId === user?.id) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5 break-words">
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {cardComments.length === 0 && (
                                            <p className="text-center text-sm text-gray-500 italic py-4">Sin comentarios todavía.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setEditingCard(null)}
                                        className="px-4 py-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
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
                    {isMembersModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMembersModalOpen(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">Miembros del Tablero</h2>
                                    <button onClick={() => setIsMembersModalOpen(false)} className="text-gray-400 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleInviteMember} className="mb-8 relative z-10">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Invitar por correo</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="correo@ejemplo.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-orange-500 transition-all text-white"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isInviting}
                                            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                                        >
                                            {isInviting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                            Invitar
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Lista de Miembros</h3>

                                    {/* Owner */}
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center font-bold overflow-hidden shadow-inner">
                                                {selectedBoard?.owner?.avatar ? <img src={selectedBoard.owner.avatar} className="w-full h-full object-cover" /> : selectedBoard?.owner?.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{selectedBoard?.owner?.name}</div>
                                                <div className="text-xs text-orange-500 flex items-center gap-1 font-semibold uppercase tracking-tighter">Dueño</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Members */}
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {selectedBoard?.members?.map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold overflow-hidden shadow-inner text-sm">
                                                        {m.user.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" /> : m.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white text-sm">{m.user.name}</div>
                                                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{m.user.email}</div>
                                                    </div>
                                                </div>
                                                {(selectedBoard?.ownerId === user?.id || m.userId === user?.id) && (
                                                    <button
                                                        onClick={() => handleRemoveMember(m.userId)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Eliminar miembro"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {(!selectedBoard?.members || selectedBoard.members.length === 0) && (
                                            <div className="text-center py-4 text-sm text-gray-500 italic">No hay otros miembros aún</div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DashboardPage;
