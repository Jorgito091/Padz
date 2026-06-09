import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Trash2,
    Loader2,
    Pencil,
    AlertCircle,
    X,
    Check,
    ListTodo,
} from 'lucide-react';
import api from '../../services/api';
import { ChecklistData } from '../../types';

interface CardChecklistsProps {
    cardId: string;
    canEdit: boolean;
    onUpdate: () => void;
}

interface EditDraft {
    listTitle: string;
    items: Record<string, string>;
    removedItemIds: string[];
    newItem: string;
}

function getApiErrorMessage(error: unknown): string {
    const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
    const status = err.response?.status;
    const msg = err.response?.data?.message;

    if (status === 404) {
        return 'El servidor no tiene la función de subtareas (reconstruye el contenedor «back»).';
    }
    if (status === 403) return 'No tienes permiso para editar esta tarjeta.';
    if (status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.';
    if (status === 500) return 'Error en el servidor. ¿Aplicaste las migraciones de la base de datos?';
    return msg || err.message || 'No se pudo conectar con el servidor.';
}

function listProgress(checklist: ChecklistData) {
    const total = checklist.items.length;
    const done = checklist.items.filter((i) => i.isDone).length;
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

function ProgressBar({ done, total, className = '' }: { done: number; total: number; className?: string }) {
    if (total === 0) return null;
    const percent = (done / total) * 100;
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[72px]">
                <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <span className="text-[10px] font-bold text-gray-500 tabular-nums shrink-0">
                {done}/{total}
            </span>
        </div>
    );
}

export const CardChecklists: React.FC<CardChecklistsProps> = ({ cardId, canEdit, onUpdate }) => {
    const [checklists, setChecklists] = useState<ChecklistData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [addingItemChecklistId, setAddingItemChecklistId] = useState<string | null>(null);

    const fetchChecklists = useCallback(async () => {
        setLoadError(null);
        try {
            const response = await api.get(`/checklists/card/${cardId}`);
            setChecklists(response.data);
        } catch (error) {
            console.error('Error fetching checklists:', error);
            setLoadError(getApiErrorMessage(error));
            setChecklists([]);
        } finally {
            setLoading(false);
        }
    }, [cardId]);

    useEffect(() => {
        setLoading(true);
        setEditingChecklistId(null);
        setEditDraft(null);
        fetchChecklists();
    }, [fetchChecklists]);

    const startEditing = (checklist: ChecklistData) => {
        setEditingChecklistId(checklist.id);
        setEditDraft({
            listTitle: checklist.title,
            items: Object.fromEntries(checklist.items.map((i) => [i.id, i.title])),
            removedItemIds: [],
            newItem: '',
        });
        setActionError(null);
    };

    const cancelEditing = () => {
        setEditingChecklistId(null);
        setEditDraft(null);
        setActionError(null);
    };

    const handleCreateChecklist = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!canEdit) return;

        const title = newListTitle.trim() || 'Subtareas';
        setIsCreatingList(true);
        setActionError(null);

        try {
            const response = await api.post('/checklists', { cardId, title });
            const created: ChecklistData = response.data;
            setChecklists((prev) => [...prev, created]);
            setNewListTitle('');
            onUpdate();
            startEditing(created);
        } catch (error) {
            console.error('Error creating checklist:', error);
            setActionError(getApiErrorMessage(error));
        } finally {
            setIsCreatingList(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingChecklistId || !editDraft) return;

        const checklist = checklists.find((c) => c.id === editingChecklistId);
        if (!checklist) return;

        const listTitle = editDraft.listTitle.trim();
        if (!listTitle) {
            setActionError('El nombre de la lista no puede estar vacío.');
            return;
        }

        setIsSavingEdit(true);
        setActionError(null);

        try {
            if (listTitle !== checklist.title) {
    await api.put(`/checklists/${editingChecklistId}`, { title: listTitle, order: checklist.order });
    // Optimistically update local state to reflect the new title
    setChecklists(prev =>
        prev.map(c => (c.id === editingChecklistId ? { ...c, title: listTitle } : c))
    );
}

            for (const itemId of editDraft.removedItemIds) {
                await api.delete(`/checklists/items/${itemId}`);
            }

            for (const item of checklist.items) {
                if (editDraft.removedItemIds.includes(item.id)) continue;
                const draftTitle = editDraft.items[item.id]?.trim();
                if (!draftTitle) {
                    setActionError('Cada subtarea debe tener un nombre.');
                    setIsSavingEdit(false);
                    return;
                }
                if (draftTitle !== item.title) {
                    await api.put(`/checklists/items/${item.id}`, { title: draftTitle });
                }
            }

            const newItemTitle = editDraft.newItem.trim();
            if (newItemTitle) {
                await api.post('/checklists/items', {
                    checklistId: editingChecklistId,
                    title: newItemTitle,
                });
            }

            await fetchChecklists();
            onUpdate();
            cancelEditing();
        } catch (error) {
            console.error('Error saving checklist edits:', error);
            setActionError(getApiErrorMessage(error));
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeleteChecklist = async (checklistId: string) => {
        if (!window.confirm('¿Eliminar esta lista de subtareas y todo su contenido?')) return;
        if (editingChecklistId === checklistId) cancelEditing();
        setActionError(null);
        try {
            await api.delete(`/checklists/${checklistId}`);
            setChecklists((prev) => prev.filter((c) => c.id !== checklistId));
            onUpdate();
        } catch (error) {
            console.error('Error deleting checklist:', error);
            setActionError(getApiErrorMessage(error));
        }
    };

    const handleToggleItem = async (itemId: string, isDone: boolean) => {
        if (editingChecklistId) return;
        setChecklists((prev) =>
            prev.map((c) => ({
                ...c,
                items: c.items.map((item) =>
                    item.id === itemId ? { ...item, isDone: !isDone } : item
                ),
            }))
        );
        try {
            await api.put(`/checklists/items/${itemId}`, { isDone: !isDone });
            onUpdate();
        } catch (error) {
            console.error('Error updating item:', error);
            fetchChecklists();
        }
    };

    const handleQuickAddItem = async (checklistId: string, title: string) => {
        if (!title.trim()) return;
        setAddingItemChecklistId(checklistId);
        setActionError(null);
        try {
            const response = await api.post('/checklists/items', { checklistId, title: title.trim() });
            setChecklists((prev) =>
                prev.map((c) =>
                    c.id === checklistId ? { ...c, items: [...c.items, response.data] } : c
                )
            );
            onUpdate();
        } catch (error) {
            console.error('Error adding item:', error);
            setActionError(getApiErrorMessage(error));
        } finally {
            setAddingItemChecklistId(null);
        }
    };

    const markItemRemovedInDraft = (itemId: string) => {
        if (!editDraft) return;
        const next = { ...editDraft.items };
        delete next[itemId];
        setEditDraft({
            ...editDraft,
            items: next,
            removedItemIds: editDraft.removedItemIds.includes(itemId)
                ? editDraft.removedItemIds
                : [...editDraft.removedItemIds, itemId],
        });
    };

    const handleDeleteItem = async (checklistId: string, itemId: string) => {
        if (editingChecklistId === checklistId) {
            markItemRemovedInDraft(itemId);
            return;
        }
        try {
            await api.delete(`/checklists/items/${itemId}`);
            setChecklists((prev) =>
                prev.map((c) =>
                    c.id === checklistId
                        ? { ...c, items: c.items.filter((item) => item.id !== itemId) }
                        : c
                )
            );
            onUpdate();
        } catch (error) {
            console.error('Error deleting item:', error);
            setActionError(getApiErrorMessage(error));
        }
    };

    const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
    const doneItems = checklists.reduce(
        (sum, c) => sum + c.items.filter((i) => i.isDone).length,
        0
    );

    if (loading) {
        return (
            <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 size={16} className="animate-spin text-orange-500" />
                    Cargando subtareas...
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {/* Cabecera de sección */}
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
                            <ListTodo size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white leading-none">Subtareas</h3>
                            <p className="text-[10px] text-gray-500 mt-1">
                                {checklists.length === 0
                                    ? 'Sin listas'
                                    : `${checklists.length} lista${checklists.length > 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                    {totalItems > 0 && (
                        <div className="w-full sm:w-40">
                            <ProgressBar done={doneItems} total={totalItems} />
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-4">
                {(loadError || actionError) && (
                    <div className="flex gap-2 items-start p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs leading-relaxed">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{actionError || loadError}</span>
                    </div>
                )}

                {!canEdit && (
                    <p className="text-xs text-gray-500 text-center py-2">Solo lectura</p>
                )}

                {checklists.length === 0 && !loadError && (
                    <p className="text-sm text-gray-500 text-center py-4">
                        Crea una lista para organizar pasos dentro de esta tarjeta.
                    </p>
                )}

                {/* Listas */}
                <div className="space-y-3">
                    {checklists.map((checklist) => {
                        const isEditing = editingChecklistId === checklist.id && editDraft;
                        const progress = listProgress(checklist);

                        return (
                            <article
                                key={checklist.id}
                                className={`rounded-xl border overflow-hidden transition-all ${
                                    isEditing
                                        ? 'border-orange-500/40 bg-orange-500/[0.04] shadow-[0_0_0_1px_rgba(249,115,22,0.15)]'
                                        : 'border-white/5 bg-white/[0.03]'
                                }`}
                            >
                                {isEditing ? (
                                    <EditChecklistPanel
                                        checklist={checklist}
                                        editDraft={editDraft}
                                        isSaving={isSavingEdit}
                                        onDraftChange={setEditDraft}
                                        onSave={handleSaveEdit}
                                        onCancel={cancelEditing}
                                        onRemoveItem={(itemId) =>
                                            handleDeleteItem(checklist.id, itemId)
                                        }
                                    />
                                ) : (
                                    <ViewChecklistPanel
                                        checklist={checklist}
                                        progress={progress}
                                        canEdit={canEdit}
                                        isAddingItem={addingItemChecklistId === checklist.id}
                                        onEdit={() => startEditing(checklist)}
                                        onDelete={() => handleDeleteChecklist(checklist.id)}
                                        onToggleItem={handleToggleItem}
                                        onQuickAdd={(title) => handleQuickAddItem(checklist.id, title)}
                                    />
                                )}
                            </article>
                        );
                    })}
                </div>

                {/* Nueva lista */}
                {canEdit && (
                    <form
                        onSubmit={handleCreateChecklist}
                        className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5"
                    >
                        <input
                            type="text"
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="Nueva lista (ej. Compras, Sprint)..."
                            maxLength={100}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                        />
                        <button
                            type="submit"
                            disabled={isCreatingList}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shrink-0"
                        >
                            {isCreatingList ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Plus size={16} />
                            )}
                            Nueva lista
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
};

/* ——— Vista normal de una lista ——— */

function ViewChecklistPanel({
    checklist,
    progress,
    canEdit,
    isAddingItem,
    onEdit,
    onDelete,
    onToggleItem,
    onQuickAdd,
}: {
    checklist: ChecklistData;
    progress: { done: number; total: number; percent: number };
    canEdit: boolean;
    isAddingItem: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onToggleItem: (id: string, isDone: boolean) => void;
    onQuickAdd: (title: string) => Promise<void>;
}) {
    return (
        <>
            <header className="px-4 py-3 flex items-center gap-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{checklist.title}</h4>
                    {progress.total > 0 && (
                        <div className="mt-2">
                            <ProgressBar done={progress.done} total={progress.total} />
                        </div>
                    )}
                </div>
                {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={onEdit}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-300 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/20 transition-all"
                        >
                            <Pencil size={13} /> Editar
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Eliminar lista"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                )}
            </header>

            <div className="px-2 py-2">
                {checklist.items.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-3 px-2">
                        Vacía — usa <span className="text-orange-400/90">Editar</span> o añade abajo.
                    </p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {checklist.items.map((item) => (
                            <li key={item.id}>
                                <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] group transition-colors">
                                    <button
                                        type="button"
                                        disabled={!canEdit}
                                        onClick={() => onToggleItem(item.id, item.isDone)}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                            item.isDone
                                                ? 'bg-green-500 border-green-400 text-white'
                                                : 'border-white/25 hover:border-orange-500/60 bg-white/5'
                                        } ${!canEdit ? 'opacity-50 cursor-default' : ''}`}
                                    >
                                        {item.isDone && <Check size={12} strokeWidth={3} />}
                                    </button>
                                    <span
                                        className={`flex-1 text-sm leading-snug ${
                                            item.isDone
                                                ? 'text-gray-500 line-through'
                                                : 'text-gray-200'
                                        }`}
                                    >
                                        {item.title}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {canEdit && (
                <footer className="px-3 pb-3 pt-1">
                    <QuickAddRow isLoading={isAddingItem} onAdd={onQuickAdd} />
                </footer>
            )}
        </>
    );
}

/* ——— Modo edición ——— */

function EditChecklistPanel({
    checklist,
    editDraft,
    isSaving,
    onDraftChange,
    onSave,
    onCancel,
    onRemoveItem,
}: {
    checklist: ChecklistData;
    editDraft: EditDraft;
    isSaving: boolean;
    onDraftChange: (draft: EditDraft) => void;
    onSave: () => void;
    onCancel: () => void;
    onRemoveItem: (itemId: string) => void;
}) {
    const visibleItems = checklist.items.filter(
        (item) => !editDraft.removedItemIds.includes(item.id)
    );

    return (
        <>
            <header className="px-4 py-3 border-b border-orange-500/20 bg-orange-500/10">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                    Editando lista
                </span>
                <input
                    type="text"
                    value={editDraft.listTitle}
                    onChange={(e) => onDraftChange({ ...editDraft, listTitle: e.target.value })}
                    maxLength={100}
                    className="mt-2 w-full bg-black/20 border border-orange-500/30 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    placeholder="Nombre de la lista"
                />
            </header>

            <div className="px-4 py-3 space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Subtareas ({visibleItems.length})
                </p>
                {visibleItems.length === 0 && (
                    <p className="text-xs text-gray-600 py-2">Añade subtareas abajo.</p>
                )}
                {visibleItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        </span>
                        <input
                            type="text"
                            value={editDraft.items[item.id] ?? item.title}
                            onChange={(e) =>
                                onDraftChange({
                                    ...editDraft,
                                    items: { ...editDraft.items, [item.id]: e.target.value },
                                })
                            }
                            maxLength={500}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                        />
                        <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all shrink-0"
                            title="Quitar"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                    <Plus size={14} className="text-orange-500/70 shrink-0" />
                    <input
                        type="text"
                        value={editDraft.newItem}
                        onChange={(e) => onDraftChange({ ...editDraft, newItem: e.target.value })}
                        placeholder="Nueva subtarea..."
                        className="flex-1 bg-white/5 border border-dashed border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40"
                    />
                </div>
            </div>

            <footer className="px-4 py-3 flex flex-wrap gap-2 border-t border-orange-500/20 bg-black/10">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Guardar
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold transition-all"
                >
                    <X size={14} /> Cancelar
                </button>
            </footer>
        </>
    );
}

function QuickAddRow({
    isLoading,
    onAdd,
}: {
    isLoading: boolean;
    onAdd: (title: string) => Promise<void>;
}) {
    const [text, setText] = useState('');

    const submit = async () => {
        if (!text.trim()) return;
        await onAdd(text);
        setText('');
    };

    return (
        <div className="flex gap-2">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submit();
                    }
                }}
                placeholder="+ Añadir subtarea..."
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
            <button
                type="button"
                disabled={isLoading || !text.trim()}
                onClick={submit}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-orange-600/30 hover:text-orange-200 disabled:opacity-40 text-gray-300 transition-all"
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
        </div>
    );
}

export function getChecklistProgress(checklists?: ChecklistData[]) {
    if (!checklists?.length) return null;
    const total = checklists.reduce((sum, c) => sum + c.items.length, 0);
    if (total === 0) return null;
    const done = checklists.reduce(
        (sum, c) => sum + c.items.filter((i) => i.isDone).length,
        0
    );
    return { done, total };
}
