import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Send, Pencil, Mail, Check } from 'lucide-react';
import { Card, Board, CommentData, LabelData } from '../../types';
import api from '../../services/api';
import Logo from '../Logo';
import { CardChecklists } from '../card/CardChecklists';

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

    const userRole = board.members?.find(m => m.userId === user?.id)?.role;
    const isOwner = board.ownerId === user?.id;
    const canEdit = isOwner || userRole === 'MEMBER';

    const handleUpdate = async (e?: React.FormEvent) => {
        if (!canEdit) return;
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="w-full max-w-2xl bg-white border border-black/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
                {/* Modal Header/Top Bar */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-black/10 bg-[#f5f2ec]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-black/10">
                            <Pencil className="text-[#111111]" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-[#111111] leading-none">Detalles de Tarjeta</h2>
                            <p className="text-xs text-[#6b6b6f] font-medium mt-1 uppercase tracking-widest">En lista: <span className="text-[#111111]">{board.lists?.find(l => l.id === card.listId)?.title}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-[#6b6b6f] hover:text-[#111111] transition-all">
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
                                    readOnly={!canEdit}
                                    value={editTitle}
                                    onBlur={() => handleUpdate()}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className={`w-full bg-transparent border-none p-0 text-3xl font-semibold text-[#111111] focus:ring-0 placeholder:text-[#8b8b8f] transition-all mb-2 ${!canEdit ? 'cursor-default' : ''}`}
                                    placeholder="Título de la tarjeta..."
                                />
                                <div className="flex flex-wrap gap-4 items-center">
                                    {card.assignees && card.assignees.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-medium text-[#6b6b6f] uppercase tracking-widest">Miembros</span>
                                            <div className="flex -space-x-2">
                                                {card.assignees.map((a) => (
                                                    <div 
                                                        key={a.user.id}
                                                        title={a.user.name}
                                                        className="w-8 h-8 rounded-full border border-black/10 bg-[#f5f2ec] overflow-hidden"
                                                    >
                                                        {a.user.avatar ? (
                                                            <img src={a.user.avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-[#6b6b6f]">
                                                                {a.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {canEdit && (
                                                    <button 
                                                        onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)}
                                                        className="w-8 h-8 rounded-full border border-black/10 bg-white hover:bg-[#f5f2ec] flex items-center justify-center text-[#6b6b6f] transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-medium text-[#6b6b6f] uppercase tracking-widest">Etiquetas</span>
                                        <div className="flex flex-wrap gap-2">
                                            {card.labels?.map((l) => (
                                                <div
                                                    key={l.label.id}
                                                    className="px-3 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider flex items-center gap-2 border border-black/10 bg-[#f5f2ec] text-[#111111]"
                                                >
                                                    {l.label.name}
                                                </div>
                                            ))}
                                            {canEdit && (
                                                <button 
                                                    onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
                                                    className="px-2 py-1 rounded-lg border border-black/10 bg-white hover:bg-[#f5f2ec] text-[#6b6b6f] transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-[#6b6b6f] uppercase tracking-widest">
                                    <Logo size={16} /> Descripción
                                </label>
                                <textarea
                                    readOnly={!canEdit}
                                    value={editDescription}
                                    onBlur={() => handleUpdate()}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className={`w-full bg-[#f5f2ec] border border-black/10 rounded-2xl p-4 text-[#111111] focus:outline-none focus:border-black/20 h-40 resize-none transition-colors placeholder:text-[#8b8b8f] leading-relaxed ${!canEdit ? 'cursor-default' : ''}`}
                                    placeholder={canEdit ? "Añade una descripción más detallada sobre esta tarea..." : "Sin descripción."}
                                />
                            </div>

                            <CardChecklists cardId={card.id} canEdit={canEdit} onUpdate={onUpdate} />

                            {/* Comments Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-[#6b6b6f] uppercase tracking-widest">
                                    <Plus size={16} /> Comentarios
                                </label>
                                <form onSubmit={handlePostComment} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-black/10">
                                    <div className="w-10 h-10 rounded-full bg-[#f5f2ec] flex items-center justify-center text-xs font-semibold shrink-0 border border-black/10 text-[#111111]">
                                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="" /> : user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="w-full bg-transparent border-none p-0 text-sm text-[#111111] focus:ring-0 resize-none min-h-[60px]"
                                            placeholder="Escribe un comentario..."
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isPostingComment || !newComment.trim()}
                                                className="px-4 py-2 bg-[#111111] text-white disabled:opacity-50 rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
                                            >
                                                Comentar <Send size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="space-y-6 pt-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <div className="w-10 h-10 rounded-full bg-[#f5f2ec] flex items-center justify-center text-xs font-semibold shrink-0 border border-black/10 text-[#111111]">
                                                {comment.user.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover rounded-full" alt="" /> : comment.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-[#111111] leading-none">{comment.user.name}</span>
                                                        <span className="text-[10px] text-[#8b8b8f] font-medium">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {(comment.user.id === user?.id || board.ownerId === user?.id) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#f5f2ec] hover:text-[#111111] rounded transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-[#6b6b6f] leading-relaxed bg-[#f5f2ec] p-4 rounded-2xl border border-black/10">
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
                                <h4 className="text-[10px] font-medium text-[#6b6b6f] uppercase tracking-[0.2em]">Acciones</h4>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium border ${isMemberPickerOpen ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#6b6b6f] border-black/10 hover:bg-[#f5f2ec] hover:text-[#111111]'}`}
                                        >
                                            <Mail size={16} /> Miembros
                                        </button>
                                        <AnimatePresence>
                                            {isMemberPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="absolute left-0 right-0 mt-2 bg-white border border-black/10 rounded-2xl p-4 z-50 space-y-2 shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                                                >
                                                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                                        {board.members?.map(member => (
                                                            <div
                                                                key={member.user.id}
                                                                onClick={() => handleAssignUser(member.user.id)}
                                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${card.assignees?.some(a => a.user.id === member.user.id) ? 'bg-[#f5f2ec] text-[#111111]' : 'hover:bg-[#f5f2ec] text-[#6b6b6f] hover:text-[#111111]'}`}
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-[#f5f2ec] overflow-hidden shrink-0 border border-black/10">
                                                                    {member.user.avatar ? (
                                                                        <img src={member.user.avatar} className="w-full h-full object-cover" alt="" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-semibold text-[#111111]">
                                                                            {member.user.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-semibold truncate">{member.user.name}</span>
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
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium border ${isLabelPickerOpen ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#6b6b6f] border-black/10 hover:bg-[#f5f2ec] hover:text-[#111111]'}`}
                                        >
                                            <Logo size={16} /> Etiquetas
                                        </button>

                                        <AnimatePresence>
                                            {isLabelPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="absolute left-0 right-0 mt-2 bg-white border border-black/10 rounded-2xl p-4 z-50 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                                                >
                                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                        {board.labels?.map(label => (
                                                            <div
                                                                key={label.id}
                                                                onClick={() => handleAssignLabel(label.id)}
                                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${card.labels?.some(l => l.label.id === label.id) ? 'bg-[#f5f2ec] text-[#111111]' : 'hover:bg-[#f5f2ec]'}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: label.color }} />
                                                                    <span className="text-xs font-semibold truncate max-w-[100px]">{label.name}</span>
                                                                </div>
                                                                <button onClick={(e) => handleDeleteLabel(e, label.id)} className="p-1 hover:text-[#111111]">
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2 border-t border-black/10">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={newLabelForm.name}
                                                                onChange={(e) => setNewLabelForm({ ...newLabelForm, name: e.target.value })}
                                                                placeholder="Nueva..."
                                                                className="flex-1 bg-[#f5f2ec] border border-black/10 rounded-lg px-2 py-1 text-[10px] text-[#111111] focus:outline-none focus:border-black/20"
                                                            />
                                                            <input
                                                                type="color"
                                                                value={newLabelForm.color}
                                                                onChange={(e) => setNewLabelForm({ ...newLabelForm, color: e.target.value })}
                                                                className="w-6 h-6 rounded border-none bg-transparent cursor-pointer"
                                                            />
                                                            <button onClick={handleCreateLabel} className="p-1 bg-[#111111] text-white rounded-lg"><Plus size={14} /></button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-medium text-[#6b6b6f] uppercase tracking-[0.2em]">Más</h4>
                                <div className="bg-white border border-black/10 rounded-2xl p-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-[#6b6b6f] uppercase tracking-widest block">Vencimiento</label>
                                        <input
                                            type="datetime-local"
                                            readOnly={!canEdit}
                                            value={editDueDate}
                                            onChange={(e) => {
                                                if (!canEdit) return;
                                                setEditDueDate(e.target.value);
                                                // Handle update after state change
                                                setTimeout(() => handleUpdate(), 100);
                                            }}
                                            className={`w-full bg-[#f5f2ec] border border-black/10 rounded-xl p-2 text-xs text-[#111111] focus:outline-none focus:border-black/20 ${!canEdit ? 'cursor-default opacity-50' : ''}`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-[#6b6b6f] uppercase tracking-widest">¿Terminado?</span>
                                        <button
                                            onClick={() => {
                                                if (!canEdit) return;
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
                                            className={`w-12 h-6 rounded-full transition-colors relative border ${editIsDone ? 'bg-[#111111] border-[#111111]' : 'bg-[#f5f2ec] border-black/10'} ${!canEdit ? 'cursor-default' : ''}`}
                                        >
                                            <div className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-colors ${editIsDone ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Actions */}
                <div className="px-8 py-6 border-t border-black/10 bg-[#f5f2ec] flex justify-between items-center">
                    {canEdit && (
                        <button
                            onClick={() => {
                                if (window.confirm('¿Eliminar esta tarjeta definitivamente?')) {
                                    api.delete(`/cards/${card.id}`).then(() => {
                                        onUpdate();
                                        onClose();
                                    });
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[#f5f2ec] text-[#6b6b6f] hover:text-[#111111] rounded-xl text-xs font-medium transition-all border border-transparent hover:border-black/10"
                        >
                            <Trash2 size={16} /> Eliminar Tarjeta
                        </button>
                    )}
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 hover:bg-white text-[#6b6b6f] font-medium rounded-xl text-xs transition-all">Cancelar</button>
                        <button onClick={() => { handleUpdate(); onClose(); }} className="px-8 py-2 bg-[#111111] text-white font-medium rounded-xl text-xs transition-colors">Listo</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

