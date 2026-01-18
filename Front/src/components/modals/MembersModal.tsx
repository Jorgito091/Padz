import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import { Board } from '../../types';
import api from '../../services/api';

interface MembersModalProps {
    board: Board;
    user: any;
    onClose: () => void;
    onUpdate: () => void;
}

export const MembersModal: React.FC<MembersModalProps> = ({ board, user, onClose, onUpdate }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        try {
            await api.post('/members', {
                boardId: board.id,
                email: inviteEmail,
                role: 'MEMBER'
            });
            onUpdate();
            setInviteEmail('');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al invitar miembro');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberUserId: string) => {
        try {
            await api.delete(`/members/${board.id}/${memberUserId}`);
            onUpdate();
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
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
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
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
                                {board.owner?.avatar ? <img src={board.owner.avatar} className="w-full h-full object-cover" /> : board.owner?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-white">{board.owner?.name}</div>
                                <div className="text-xs text-orange-500 flex items-center gap-1 font-semibold uppercase tracking-tighter">Dueño</div>
                            </div>
                        </div>
                    </div>

                    {/* Members */}
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {board.members?.map(m => (
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
                                {(board.ownerId === user?.id || m.userId === user?.id) && (
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
                        {(!board.members || board.members.length === 0) && (
                            <div className="text-center py-4 text-sm text-gray-500 italic">No hay otros miembros aún</div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
