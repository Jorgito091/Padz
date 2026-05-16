import React, { useState } from 'react';
import {
    DndContext,
    closestCorners,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    SensorDescriptor,
    SensorOptions
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Plus, Trash2, X } from 'lucide-react';
import { Board, Card } from '../../types';
import { SortableCard } from '../SortableCard';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo';

interface BoardViewProps {
    board: Board;
    boardLoading: boolean;
    activeId: string | null;
    sensors: SensorDescriptor<SensorOptions>[];
    onDragStart: (event: DragStartEvent) => void;
    onDragOver: (event: DragOverEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
    onCreateList: (title: string) => Promise<boolean>;
    onDeleteList: (id: string) => Promise<void>;
    onCreateCard: (title: string, listId: string) => Promise<boolean>;
    onDeleteCard: (cardId: string, listId: string) => Promise<void>;
    onEditCard: (card: Card) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
    board,
    boardLoading,
    activeId,
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
    onCreateList,
    onDeleteList,
    onCreateCard,
    onDeleteCard,
    onEditCard
}) => {
    const { user } = useAuth();
    const [isCreatingList, setIsCreatingList] = useState(false);
    
    const userRole = board.members?.find(m => m.userId === user?.id)?.role;
    const isOwner = board.ownerId === user?.id;
    const canEdit = isOwner || userRole === 'MEMBER';
    
    const [newListTitle, setNewListTitle] = useState('');
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newCardTitle, setNewCardTitle] = useState('');

    const handleCreateListSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onCreateList(newListTitle);
        if (success) {
            setNewListTitle('');
            setIsCreatingList(false);
        }
    };

    const handleCreateCardSubmit = async (listId: string) => {
        const success = await onCreateCard(newCardTitle, listId);
        if (success) {
            setNewCardTitle('');
            setActiveListId(null);
        }
    };

    if (boardLoading) {
        return (
            <div className="flex gap-6 overflow-x-auto pb-6 items-start scrollbar-hide min-h-[500px]">
                {[1, 2, 3].map(n => (
                    <div key={n} className="min-w-[320px] h-64 rounded-2xl bg-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={canEdit ? onDragStart : undefined}
            onDragOver={canEdit ? onDragOver : undefined}
            onDragEnd={canEdit ? onDragEnd : undefined}
        >
            <div className="flex gap-6 overflow-x-auto pb-6 items-start scrollbar-hide min-h-[500px]">
                {board.lists?.map((list) => (
                    <div key={list.id} className="min-w-[320px] max-w-[320px] backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-5 px-1 text-orange-400 group/list-header">
                            <h3 className="font-bold uppercase text-xs tracking-widest">{list.title}</h3>
                            <div className="flex gap-1 items-center">
                                {canEdit && (
                                    <>
                                        <button
                                            onClick={() => onDeleteList(list.id)}
                                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-all opacity-0 group-hover/list-header:opacity-100"
                                            title="Eliminar lista"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => { setActiveListId(list.id); setNewCardTitle(''); }}
                                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
                                            <Logo size={18} />
                                        </button>
                                    </>
                                )}
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
                                        onClick={() => onEditCard(card)}
                                        onEdit={() => onEditCard(card)}
                                        onDelete={() => onDeleteCard(card.id, list.id)}
                                        labels={card.labels}
                                        assignees={card.assignees}
                                        dueDate={card.dueDate}
                                        isDone={card.isDone}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        {canEdit && (
                            activeListId === list.id ? (
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
                                                handleCreateCardSubmit(list.id);
                                            }
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleCreateCardSubmit(list.id)}
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
                            )
                        )}
                    </div>
                ))}

                {canEdit && (
                    isCreatingList ? (
                        <form onSubmit={handleCreateListSubmit} className="min-w-[320px] backdrop-blur-xl bg-white/[0.05] border border-orange-500/50 rounded-2xl p-4 shadow-2xl">
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
                    )
                )}
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="bg-white/10 p-4 rounded-xl border border-orange-500 ring-2 ring-orange-500/50 shadow-2xl text-white rotate-3 cursor-grabbing backdrop-blur-lg">
                        {board.lists?.flatMap(l => l.cards).find(c => c.id === activeId)?.title}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
