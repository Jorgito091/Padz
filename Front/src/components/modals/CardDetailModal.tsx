import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Send } from 'lucide-react';
import { Card, Board, CommentData, LabelData } from '../../types';
import api from '../../services/api';

interface CardDetailModalProps {
    card: Card;
    board: Board;
    user: any; // Ideally use AuthUser type
    onClose: () => void;
    onUpdate: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, board, user, onClose, onUpdate }) => {
    const [editTitle, setEditTitle] = useState(card.title);
    const [editDescription, setEditDescription] = useState(card.description || '');
    const [editDueDate, setEditDueDate] = useState('');
    const [editIsDone, setEditIsDone] = useState(card.isDone || false);

    const [comments, setComments] = useState<CommentData[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
    const [newLabelForm, setNewLabelForm] = useState({ name: '', color: '#f97316' });
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);

    useEffect(() => {
        setEditTitle(card.title);
        setEditDescription(card.description || '');
        setEditDueDate(formatToLocalISO(card.dueDate));
        setEditIsDone(card.isDone || false);
        fetchComments();
    }, [card]);

    const formatToLocalISO = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    const fetchComments = async () => {
        try {
            const response = await api.get(`/comments/${card.id}`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/cards/${card.id}`, {
                title: editTitle,
                description: editDescription,
                order: card.order,
                listId: card.listId,
                dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
                isDone: editIsDone
            });
            onUpdate();
        } catch (error) {
            console.error('Error updating card:', error);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsPostingComment(true);
        try {
            const response = await api.post('/comments', {
                cardId: card.id,
                text: newComment
            });
            setComments([response.data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleDeleteComment = async (id: string) => {
        try {
            await api.delete(`/comments/${id}`);
            setComments(comments.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleAssignLabel = async (labelId: string) => {
        if (card.labels?.some(l => l.label.id === labelId)) {
            handleUnassignLabel(labelId);
            return;
        }
        try {
            await api.post('/labels/assign', { cardId: card.id, labelId });
            onUpdate();
        } catch (error) {
            console.error('Error assigning label:', error);
        }
    };

    const handleUnassignLabel = async (labelId: string) => {
        try {
            await api.delete(`/labels/unassign/${card.id}/${labelId}`);
            onUpdate();
        } catch (error) {
            console.error('Error unassigning label:', error);
        }
    };

    const handleCreateLabel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabelForm.name.trim()) return;
        setIsCreatingLabel(true);
        try {
            await api.post('/labels', { ...newLabelForm, boardId: board.id });
            setNewLabelForm({ name: '', color: '#f97316' });
            onUpdate();
        } catch (error) {
            console.error('Error creating label:', error);
        } finally {
            setIsCreatingLabel(false);
        }
    };

    const handleDeleteLabel = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar esta etiqueta de todo el tablero?')) return;
        try {
            await api.delete(`/labels/${id}`);
            onUpdate();
        } catch (error) {
            console.error('Error deleting label:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Editar Tarjeta</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold uppercase tracking-wider">Título de la Tarjeta</label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all font-medium"
                            placeholder="Título de la tarjeta"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold uppercase tracking-wider">Etiquetas</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {card.labels?.map((l) => (
                                <div
                                    key={l.label.id}
                                    className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2"
                                    style={{ backgroundColor: `${l.label.color}33`, border: `1px solid ${l.label.color}66`, color: l.label.color }}
                                >
                                    {l.label.name}
                                    <button
                                        type="button"
                                        onClick={() => handleUnassignLabel(l.label.id)}
                                        className="hover:text-white transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
                                className="w-8 h-8 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-orange-500/50 transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <AnimatePresence>
                            {isLabelPickerOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-zinc-900 border border-white/10 rounded-xl p-4 mb-4 shadow-xl"
                                >
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Seleccionar Etiqueta</h4>
                                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {board.labels?.map(label => {
                                            const isAssigned = card.labels?.some(l => l.label.id === label.id);
                                            return (
                                                <div
                                                    key={label.id}
                                                    onClick={() => handleAssignLabel(label.id)}
                                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isAssigned ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-white/5'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }} />
                                                        <span className="text-sm font-medium">{label.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteLabel(e, label.id)}
                                                        className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t border-white/5 pt-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newLabelForm.name}
                                                onChange={(e) => setNewLabelForm({ ...newLabelForm, name: e.target.value })}
                                                placeholder="Nueva etiqueta..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                            />
                                            <input
                                                type="color"
                                                value={newLabelForm.color}
                                                onChange={(e) => setNewLabelForm({ ...newLabelForm, color: e.target.value })}
                                                className="w-8 h-8 rounded p-0 border-none bg-transparent cursor-pointer"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateLabel}
                                                disabled={isCreatingLabel || !newLabelForm.name.trim()}
                                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white disabled:opacity-50"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold uppercase tracking-wider">Vencimiento</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm pr-10"
                                />
                                {editDueDate && (
                                    <button
                                        type="button"
                                        onClick={() => setEditDueDate('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-2 cursor-pointer group mb-3">
                                <input type="checkbox" checked={editIsDone} onChange={(e) => setEditIsDone(e.target.checked)} className="hidden" />
                                <div className={`w-10 h-6 rounded-full transition-all relative ${editIsDone ? 'bg-green-500' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editIsDone ? 'left-5' : 'left-1'}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Hecho</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-semibold uppercase tracking-wider">Descripción</label>
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 h-32 resize-none transition-all"
                            placeholder="Añade una descripción más detallada..."
                        />
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Comentarios</h3>
                        <div className="flex gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold border border-white/10 flex-shrink-0">
                                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" /> : user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                    placeholder="Escribe un comentario..."
                                />
                                <button
                                    type="button"
                                    onClick={handlePostComment}
                                    disabled={isPostingComment || !newComment.trim()}
                                    className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white disabled:opacity-50 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold border border-white/10 flex-shrink-0">
                                        {comment.user.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover rounded-full" /> : comment.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-white">{comment.user.name}</span>
                                            <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                                            {(comment.user.id === user?.id || board.ownerId === user?.id) && (
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
                            {comments.length === 0 && (
                                <p className="text-center text-sm text-gray-500 italic py-4">Sin comentarios todavía.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors">Guardar</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
