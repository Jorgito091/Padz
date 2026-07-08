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
    className?: string;
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
    onEditCard,
    className
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
            <div className={`flex h-full min-h-0 gap-6 overflow-x-auto overflow-y-hidden items-start scrollbar-hide pb-4 ${className ?? ''}`.trim()}>
                {[1, 2, 3].map(n => (
                    <div key={n} className="min-w-[320px] h-64 rounded-[28px] bg-white/12 animate-pulse backdrop-blur-sm border border-white/20" />
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
            <div className={`flex h-full min-h-0 gap-6 overflow-x-auto overflow-y-hidden items-start scrollbar-hide pb-4 ${className ?? ''}`.trim()}>
                {board.lists?.map((list) => (
                    <div key={list.id} className="flex h-full min-h-0 min-w-[320px] max-w-[320px] flex-col rounded-[28px] border border-white/35 bg-white/65 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">
                        <div className="mb-5 flex items-center justify-between px-1 text-[#111111] group/list-header">
                            <h3 className="font-semibold uppercase text-[11px] tracking-[0.2em] text-[#111111]">{list.title}</h3>
                            <div className="flex gap-1 items-center">
                                {canEdit && (
                                    <>
                                        <button
                                            onClick={() => onDeleteList(list.id)}
                                            className="p-1.5 rounded-lg text-[#8b8b8f] transition-all opacity-0 group-hover/list-header:opacity-100 hover:bg-black/5 hover:text-[#111111]"
                                            title="Eliminar lista"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => { setActiveListId(list.id); setNewCardTitle(''); }}
                                            className="p-1.5 rounded-lg text-[#8b8b8f] transition-all hover:bg-black/5 hover:text-[#111111]">
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
                            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
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
                                        checklists={card.checklists}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        {canEdit && (
                            activeListId === list.id ? (
                                <div className="mt-4 space-y-2 shrink-0">
                                    <textarea
                                        autoFocus
                                        value={newCardTitle}
                                        onChange={(e) => setNewCardTitle(e.target.value)}
                                        className="w-full bg-[#f5f2ec] border border-black/10 rounded-xl p-3 text-sm text-[#111111] focus:outline-none focus:border-black/20 resize-none placeholder:text-[#8b8b8f]"
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
                                            className="flex-1 py-2 bg-[#111111] text-white rounded-lg text-xs font-medium"
                                        >
                                            Añadir
                                        </button>
                                        <button
                                            onClick={() => setActiveListId(null)}
                                            className="px-3 py-2 bg-[#f5f2ec] rounded-lg text-[#6b6b6f]"
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
                                    className="w-full mt-5 py-2.5 px-3 text-left text-sm text-[#111111] hover:bg-white/75 rounded-xl transition-colors flex items-center gap-2 shrink-0 border border-black/5 bg-white/50"
                                >
                                    <Plus size={16} /> Añadir tarjeta
                                </button>
                            )
                        )}
                    </div>
                ))}

                {canEdit && (
                    isCreatingList ? (
                        <form onSubmit={handleCreateListSubmit} className="min-w-[320px] rounded-[28px] border border-white/35 bg-white/65 p-4 shrink-0 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">
                            <input
                                autoFocus
                                type="text"
                                value={newListTitle}
                                onChange={(e) => setNewListTitle(e.target.value)}
                                placeholder="Nombre de la lista..."
                                className="w-full bg-white/70 border border-black/10 rounded-xl px-3 py-2 text-[#111111] font-medium mb-4 focus:outline-none focus:border-black/20"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-2 bg-[#111111] text-white rounded-lg text-sm font-medium shadow-sm">Crear lista</button>
                                <button onClick={() => setIsCreatingList(false)} className="px-3 py-2 bg-white/70 rounded-lg text-[#6b6b6f] border border-black/10"><X size={18} /></button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreatingList(true)}
                            className="min-w-[320px] rounded-[28px] border border-white/35 bg-white/55 p-5 text-left font-semibold text-[#111111] transition-colors hover:bg-white/70 flex items-center gap-3 shrink-0 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl"
                        >
                            <Plus size={20} /> Añadir lista
                        </button>
                    )
                )}
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="rounded-xl border border-black/10 bg-white/90 p-4 text-[#111111] rotate-1 cursor-grabbing shadow-lg backdrop-blur">
                        {board.lists?.flatMap(l => l.cards).find(c => c.id === activeId)?.title}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
