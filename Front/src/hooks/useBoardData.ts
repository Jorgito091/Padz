import { useState, useEffect, useCallback } from 'react';
import {
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import api from '../services/api';
import { socketService } from '../services/socket';
import { Board, List, Card } from '../types';

export const useBoardData = (user: any) => {
    const [view, setView] = useState<'dashboard' | 'board'>('dashboard');
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [boardLoading, setBoardLoading] = useState(false);
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

    const fetchBoards = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/boards');
            setBoards(response.data);
        } catch (error) {
            console.error('Error fetching boards:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBoardDetail = useCallback(async (id: string, updateSelected = true) => {
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
    }, []);

    useEffect(() => {
        if (user) {
            fetchBoards();
        }
    }, [user, fetchBoards]);

    useEffect(() => {
        if (!user || !selectedBoard) return;

        const socket = socketService.connect();
        
        socket.emit('join-board', selectedBoard.id);

        const handleBoardUpdated = () => {
            fetchBoardDetail(selectedBoard.id, false);
        };

        socket.on('board-updated', handleBoardUpdated);

        return () => {
            socket.off('board-updated', handleBoardUpdated);
            socket.emit('leave-board', selectedBoard.id);
        };
    }, [user, selectedBoard?.id, fetchBoardDetail]);

    const handleSaveBoard = async (boardForm: any, editingBoard: Board | null) => {
        if (!boardForm.title.trim()) return;

        try {
            if (editingBoard) {
                const response = await api.put(`/boards/${editingBoard.id}`, boardForm);
                const updatedBoard = response.data;
                setBoards(boards.map(b => b.id === updatedBoard.id ? updatedBoard : b));
                if (selectedBoard?.id === updatedBoard.id) {
                    setSelectedBoard({ ...selectedBoard, ...updatedBoard });
                }
            } else {
                await api.post('/boards', boardForm);
                await fetchBoards();
            }
            return true;
        } catch (error) {
            console.error('Error saving board:', error);
            return false;
        }
    };

    const handleDeleteBoard = async (boardId: string, isOwner: boolean) => {
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

    const handleToggleStar = async (boardId: string) => {
        try {
            const response = await api.patch(`/boards/${boardId}/star`);
            setBoards(boards.map(b => b.id === boardId ? { ...b, isStarred: response.data.isStarred } : b));
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };

    const handleCreateList = async (title: string): Promise<boolean> => {
        if (!title.trim() || !selectedBoard) return false;

        try {
            const response = await api.post('/lists', {
                title,
                boardId: selectedBoard.id,
                order: (selectedBoard.lists?.length || 0) + 1
            });
            setSelectedBoard({
                ...selectedBoard,
                lists: [...(selectedBoard.lists || []), { ...response.data, cards: [] }]
            });
            return true;
        } catch (error) {
            console.error('Error creating list:', error);
            return false;
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (!selectedBoard) return;

        const updatedLists = selectedBoard.lists?.filter(l => l.id !== listId);
        setSelectedBoard({ ...selectedBoard, lists: updatedLists });

        try {
            await api.delete(`/lists/${listId}`);
        } catch (error) {
            console.error('Error deleting list:', error);
            fetchBoardDetail(selectedBoard.id);
        }
    };

    const handleCreateCard = async (title: string, listId: string): Promise<boolean> => {
        if (!title.trim() || !selectedBoard) return false;

        try {
            const list = selectedBoard.lists?.find(l => l.id === listId);
            const response = await api.post('/cards', {
                title,
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
            return true;
        } catch (error) {
            console.error('Error creating card:', error);
            return false;
        }
    };

    const handleDeleteCard = async (cardId: string, listId: string) => {
        if (!selectedBoard) return;

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
                        if (prev.lists!.some(l => l.id === overId)) {
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

    return {
        view,
        setView,
        boards,
        selectedBoard,
        setSelectedBoard,
        loading,
        boardLoading,
        activeId,
        sensors,
        fetchBoards,
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
    };
};
