import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, Trash2, Loader2, Pencil, AlertCircle, X, Check } from 'lucide-react';
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
                await api.put(`/checklists/${editingChecklistId}`, { title: listTitle });
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
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                <Loader2 size={16} className="animate-spin" />
                Cargando subtareas...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                <CheckSquare size={16} /> Subtareas
                {totalItems > 0 && (
                    <span className="text-[10px] font-bold text-orange-400 normal-case tracking-normal">
                        {doneItems}/{totalItems}
                    </span>
                )}
            </label>

            {(loadError || actionError) && (
                <div className="flex gap-2 items-start p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs leading-relaxed">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{actionError || loadError}</span>
                </div>
            )}

            {!canEdit && (
                <p className="text-xs text-gray-500">Solo lectura: no puedes crear ni editar subtareas.</p>
            )}

            {totalItems > 0 && (
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
                        style={{ width: `${(doneItems / totalItems) * 100}%` }}
                    />
                </div>
            )}

            {checklists.map((checklist) => {
                const isEditing = editingChecklistId === checklist.id && editDraft;

                return (
                    <div
                        key={checklist.id}
                        className={`rounded-2xl p-4 space-y-3 border transition-all ${
                            isEditing
                                ? 'bg-orange-500/5 border-orange-500/40 ring-1 ring-orange-500/20'
                                : 'bg-white/[0.03] border-white/5'
                        }`}
                    >
                        {isEditing ? (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                                        Nombre de la lista
                                    </label>
                                    <input
                                        type="text"
                                        value={editDraft.listTitle}
                                        onChange={(e) =>
                                            setEditDraft({ ...editDraft, listTitle: e.target.value })
                                        }
                                        maxLength={100}
                                        className="w-full bg-white/5 border border-orange-500/30 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                        placeholder="Ej: Compras, Tareas del proyecto..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Subtareas de esta lista
                                    </label>
                                    {checklist.items
                                        .filter((item) => !editDraft.removedItemIds.includes(item.id))
                                        .map((item) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editDraft.items[item.id] ?? item.title}
                                                onChange={(e) =>
                                                    setEditDraft({
                                                        ...editDraft,
                                                        items: {
                                                            ...editDraft.items,
                                                            [item.id]: e.target.value,
                                                        },
                                                    })
                                                }
                                                maxLength={500}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteItem(checklist.id, item.id)}
                                                className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                                                title="Eliminar subtarea (se aplica al guardar)"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editDraft.newItem}
                                            onChange={(e) =>
                                                setEditDraft({ ...editDraft, newItem: e.target.value })
                                            }
                                            placeholder="Nueva subtarea (se crea al guardar)..."
                                            className="flex-1 bg-white/5 border border-dashed border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                                        />
                                        <Plus size={14} className="text-gray-600 shrink-0" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        disabled={isSavingEdit}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                        {isSavingEdit ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Check size={14} />
                                        )}
                                        Guardar cambios
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEditing}
                                        disabled={isSavingEdit}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold transition-all"
                                    >
                                        <X size={14} /> Cancelar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <h4 className="text-sm font-bold text-white flex-1">{checklist.title}</h4>
                                    {canEdit && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(checklist)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                                                title="Editar nombre y subtareas"
                                            >
                                                <Pencil size={12} /> Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteChecklist(checklist.id)}
                                                className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                                                title="Eliminar lista"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <ul className="space-y-2">
                                    {checklist.items.length === 0 && (
                                        <li className="text-xs text-gray-600 italic py-1">
                                            Sin subtareas. Pulsa Editar para añadirlas.
                                        </li>
                                    )}
                                    {checklist.items.map((item) => (
                                        <li key={item.id} className="flex items-start gap-3 group">
                                            <button
                                                type="button"
                                                disabled={!canEdit}
                                                onClick={() => handleToggleItem(item.id, item.isDone)}
                                                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                                    item.isDone
                                                        ? 'bg-green-500 border-green-400 text-white'
                                                        : 'border-white/20 hover:border-orange-500/50'
                                                } ${!canEdit ? 'cursor-default opacity-60' : ''}`}
                                            >
                                                {item.isDone && <CheckSquare size={12} />}
                                            </button>
                                            <span
                                                className={`flex-1 text-sm leading-relaxed ${
                                                    item.isDone
                                                        ? 'text-gray-500 line-through'
                                                        : 'text-gray-300'
                                                }`}
                                            >
                                                {item.title}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {canEdit && (
                                    <QuickAddRow
                                        checklistId={checklist.id}
                                        isLoading={addingItemChecklistId === checklist.id}
                                        onAdd={handleQuickAddItem}
                                    />
                                )}
                            </>
                        )}
                    </div>
                );
            })}

            {canEdit && (
                <form
                    onSubmit={handleCreateChecklist}
                    className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-4 space-y-3"
                >
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Nueva lista de subtareas
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="Ej: Compras, Paso a paso..."
                            maxLength={100}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                        />
                        <button
                            type="submit"
                            disabled={isCreatingList}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0"
                        >
                            {isCreatingList ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Plus size={14} />
                            )}
                            Crear
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600">
                        Al crear, se abre el modo edición para nombrar la lista y añadir subtareas.
                    </p>
                </form>
            )}
        </div>
    );
};

function QuickAddRow({
    checklistId,
    isLoading,
    onAdd,
}: {
    checklistId: string;
    isLoading: boolean;
    onAdd: (checklistId: string, title: string) => Promise<void>;
}) {
    const [text, setText] = useState('');

    const submit = async () => {
        if (!text.trim()) return;
        await onAdd(checklistId, text);
        setText('');
    };

    return (
        <div className="flex gap-2 pt-1">
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
                placeholder="Añadir subtarea rápida..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
            />
            <button
                type="button"
                disabled={isLoading || !text.trim()}
                onClick={submit}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white rounded-xl transition-all"
            >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
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
