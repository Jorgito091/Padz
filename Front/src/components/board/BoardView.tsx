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
            <div className={`flex h-full min-h-0 gap-6 overflow-x-auto overflow-y-hidden items-start scrollbar-hide pb-4 ${className ?? ''}`.trim()}>
                {board.lists?.map((list) => (
                    <div key={list.id} className="flex h-full min-h-0 min-w-[320px] max-w-[320px] flex-col bg-white border border-black/10 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-5 px-1 text-[#111111] group/list-header">
                            <h3 className="font-semibold uppercase text-xs tracking-widest">{list.title}</h3>
                            <div className="flex gap-1 items-center">
                                {canEdit && (
                                    <>
                                        <button
                                            onClick={() => onDeleteList(list.id)}
                                            className="p-1.5 hover:bg-[#f5f2ec] rounded-lg text-[#8b8b8f] hover:text-[#111111] transition-colors opacity-0 group-hover/list-header:opacity-100"
                                            title="Eliminar lista"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => { setActiveListId(list.id); setNewCardTitle(''); }}
                                            className="p-1.5 hover:bg-[#f5f2ec] rounded-lg text-[#8b8b8f] hover:text-[#111111] transition-colors">
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
                                    className="w-full mt-5 py-2.5 px-3 text-left text-sm text-[#6b6b6f] hover:text-[#111111] hover:bg-[#f5f2ec] rounded-xl transition-colors flex items-center gap-2 shrink-0"
                                >
                                    <Plus size={16} /> Añadir tarjeta
                                </button>
                            )
                        )}
                    </div>
                ))}

                {canEdit && (
                    isCreatingList ? (
                        <form onSubmit={handleCreateListSubmit} className="min-w-[320px] bg-white border border-black/10 rounded-2xl p-4 shrink-0">
                            <input
                                autoFocus
                                type="text"
                                value={newListTitle}
                                onChange={(e) => setNewListTitle(e.target.value)}
                                placeholder="Nombre de la lista..."
                                className="w-full bg-transparent border-none focus:ring-0 text-[#111111] font-medium mb-4"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-2 bg-[#111111] text-white rounded-lg text-sm font-medium">Crear lista</button>
                                <button onClick={() => setIsCreatingList(false)} className="px-3 py-2 bg-[#f5f2ec] rounded-lg text-[#6b6b6f]"><X size={18} /></button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreatingList(true)}
                            className="min-w-[320px] bg-white hover:bg-[#f5f2ec] rounded-2xl p-5 text-left font-semibold text-[#6b6b6f] hover:text-[#111111] transition-colors border-dashed border border-black/10 flex items-center gap-3 shrink-0"
                        >
                            <Plus size={20} /> Añadir lista
                        </button>
                    )
                )}
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="bg-white p-4 rounded-xl border border-black/10 text-[#111111] rotate-1 cursor-grabbing">
                        {board.lists?.flatMap(l => l.cards).find(c => c.id === activeId)?.title}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
