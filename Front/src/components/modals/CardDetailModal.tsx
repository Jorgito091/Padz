import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Send, Pencil, Mail, Check } from 'lucide-react';
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
    const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
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

    const handleUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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

    const handleAssignUser = async (userId: string) => {
        if (card.assignees?.some(a => a.user.id === userId)) {
            handleUnassignUser(userId);
            return;
        }
        try {
            await api.post('/cards/assign', { cardId: card.id, userId });
            onUpdate();
        } catch (error) {
            console.error('Error assigning user:', error);
        }
    };

    const handleUnassignUser = async (userId: string) => {
        try {
            await api.delete(`/cards/unassign/${card.id}/${userId}`);
            onUpdate();
        } catch (error) {
            console.error('Error unassigning user:', error);
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="w-full max-w-2xl bg-[#141416]/90 border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Modal Header/Top Bar */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20`}>
                            <Pencil className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white leading-none">Detalles de Tarjeta</h2>
                            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">En lista: <span className="text-orange-400">{board.lists?.find(l => l.id === card.listId)?.title}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8">
                        {/* Main Content Column */}
                        <div className="space-y-8">
                            {/* Title Section */}
                            <div>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onBlur={() => handleUpdate()}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-3xl font-black text-white focus:ring-0 placeholder:text-white/20 transition-all mb-2"
                                    placeholder="Título de la tarjeta..."
                                />
                                <div className="flex flex-wrap gap-4 items-center">
                                    {card.assignees && card.assignees.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Miembros</span>
                                            <div className="flex -space-x-2">
                                                {card.assignees.map((a) => (
                                                    <div 
                                                        key={a.user.id}
                                                        title={a.user.name}
                                                        className="w-8 h-8 rounded-full border-2 border-[#141416] bg-white/10 overflow-hidden"
                                                    >
                                                        {a.user.avatar ? (
                                                            <img src={a.user.avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                                {a.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)}
                                                    className="w-8 h-8 rounded-full border-2 border-[#141416] bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Etiquetas</span>
                                        <div className="flex flex-wrap gap-2">
                                            {card.labels?.map((l) => (
                                                <div
                                                    key={l.label.id}
                                                    className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm"
                                                    style={{ backgroundColor: `${l.label.color}15`, borderColor: `${l.label.color}40`, color: l.label.color }}
                                                >
                                                    {l.label.name}
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
                                                className="px-2 py-1 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-500 transition-colors"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    <Logo size={16} /> Descripción
                                </label>
                                <textarea
                                    value={editDescription}
                                    onBlur={() => handleUpdate()}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-40 resize-none transition-all placeholder:text-gray-600 leading-relaxed"
                                    placeholder="Añade una descripción más detallada sobre esta tarea..."
                                />
                            </div>

                            {/* Comments Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    <Plus size={16} /> Comentarios
                                </label>
                                <form onSubmit={handlePostComment} className="flex gap-4 items-start bg-white/[0.03] p-4 rounded-2xl border border-white/5 ring-1 ring-white/5">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-xs font-bold shrink-0 border-2 border-white/10 shadow-lg">
                                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="" /> : user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="w-full bg-transparent border-none p-0 text-sm text-white focus:ring-0 resize-none min-h-[60px]"
                                            placeholder="Escribe un comentario..."
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isPostingComment || !newComment.trim()}
                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-950/20 flex items-center gap-2"
                                            >
                                                Comentar <Send size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="space-y-6 pt-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold shrink-0 border border-white/10">
                                                {comment.user.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover rounded-full" alt="" /> : comment.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-white leading-none">{comment.user.name}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {(comment.user.id === user?.id || board.ownerId === user?.id) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-400 rounded transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Actions Column */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Acciones</h4>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border ${isMemberPickerOpen ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-900/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <Mail size={16} /> Miembros
                                        </button>
                                        <AnimatePresence>
                                            {isMemberPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="absolute left-0 right-0 mt-2 bg-[#1a1a1c] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-2"
                                                >
                                                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                                        {board.members?.map(member => (
                                                            <div
                                                                key={member.user.id}
                                                                onClick={() => handleAssignUser(member.user.id)}
                                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${card.assignees?.some(a => a.user.id === member.user.id) ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden shrink-0">
                                                                    {member.user.avatar ? (
                                                                        <img src={member.user.avatar} className="w-full h-full object-cover" alt="" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">
                                                                            {member.user.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold truncate">{member.user.name}</span>
                                                                {card.assignees?.some(a => a.user.id === member.user.id) && <Check size={12} className="ml-auto" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border ${isLabelPickerOpen ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-900/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <Logo size={16} /> Etiquetas
                                        </button>

                                        <AnimatePresence>
                                            {isLabelPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="absolute left-0 right-0 mt-2 bg-[#1a1a1c] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-4"
                                                >
                                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                        {board.labels?.map(label => (
                                                            <div
                                                                key={label.id}
                                                                onClick={() => handleAssignLabel(label.id)}
                                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${card.labels?.some(l => l.label.id === label.id) ? 'bg-orange-600 shadow-lg' : 'hover:bg-white/5'}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: label.color }} />
                                                                    <span className="text-xs font-bold truncate max-w-[100px]">{label.name}</span>
                                                                </div>
                                                                <button onClick={(e) => handleDeleteLabel(e, label.id)} className="p-1 hover:text-red-400">
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2 border-t border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={newLabelForm.name}
                                                                onChange={(e) => setNewLabelForm({ ...newLabelForm, name: e.target.value })}
                                                                placeholder="Nueva..."
                                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:ring-1 focus:ring-orange-500"
                                                            />
                                                            <input
                                                                type="color"
                                                                value={newLabelForm.color}
                                                                onChange={(e) => setNewLabelForm({ ...newLabelForm, color: e.target.value })}
                                                                className="w-6 h-6 rounded border-none bg-transparent cursor-pointer"
                                                            />
                                                            <button onClick={handleCreateLabel} className="p-1 bg-orange-600 rounded-lg"><Plus size={14} /></button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Más</h4>
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Vencimiento</label>
                                        <input
                                            type="datetime-local"
                                            value={editDueDate}
                                            onChange={(e) => {
                                                setEditDueDate(e.target.value);
                                                // Handle update after state change
                                                setTimeout(() => handleUpdate(), 100);
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">¿Terminado?</span>
                                        <button
                                            onClick={() => {
                                                const newVal = !editIsDone;
                                                setEditIsDone(newVal);
                                                // Trigger update via a temporary state or direct call
                                                const timer = setTimeout(() => {
                                                    api.put(`/cards/${card.id}`, {
                                                        title: editTitle,
                                                        description: editDescription,
                                                        order: card.order,
                                                        listId: card.listId,
                                                        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
                                                        isDone: newVal
                                                    }).then(() => onUpdate());
                                                }, 100);
                                            }}
                                            className={`w-12 h-6 rounded-full transition-all relative border ${editIsDone ? 'bg-green-500 border-green-400' : 'bg-white/5 border-white/10'}`}
                                        >
                                            <div className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-md ${editIsDone ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Actions */}
                <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <button
                        onClick={() => {
                            if (window.confirm('¿Eliminar esta tarjeta definitivamente?')) {
                                api.delete(`/cards/${card.id}`).then(() => {
                                    onUpdate();
                                    onClose();
                                });
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 size={16} /> Eliminar Tarjeta
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 hover:bg-white/5 text-gray-400 font-bold rounded-xl text-xs transition-all">Cancelar</button>
                        <button onClick={() => { handleUpdate(); onClose(); }} className="px-8 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-orange-950/20">Listo</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Simple Logo component for the design (defined here for simplicity or imported)
const Logo: React.FC<{ size?: number }> = ({ size = 24 }) => (
    <div
        className="relative flex items-center justify-center font-black italic bg-orange-600 text-white rounded-lg shadow-lg shadow-orange-950/40 select-none animate-pulse-slow"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
    >
        P
    </div>
);
