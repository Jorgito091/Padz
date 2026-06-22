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
    const [inviteRole, setInviteRole] = useState('MEMBER');
    const [isInviting, setIsInviting] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        try {
            await api.post('/members', {
                boardId: board.id,
                email: inviteEmail,
                role: inviteRole
            });
            onUpdate();
            setInviteEmail('');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al invitar miembro');
        } finally {
            setIsInviting(false);
        }
    };

    const handleUpdateRole = async (userId: string, role: string) => {
        setUpdatingUserId(userId);
        try {
            await api.patch('/members/role', {
                boardId: board.id,
                userId,
                role
            });
            onUpdate();
        } catch (error) {
            console.error('Error updating role:', error);
        } finally {
            setUpdatingUserId(null);
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

    const isOwner = board.ownerId === user?.id;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md bg-white border border-black/10 rounded-2xl p-6 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-[#111111]">Miembros del Tablero</h2>
                        <p className="text-[10px] text-[#6b6b6f] font-medium uppercase tracking-widest mt-0.5">Gestionar accesos y roles</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#f5f2ec] rounded-xl text-[#6b6b6f] hover:text-[#111111] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {isOwner && (
                    <form onSubmit={handleInviteMember} className="mb-8 relative z-10 bg-[#f5f2ec] p-4 rounded-xl border border-black/10">
                        <label className="block text-[10px] font-medium text-[#6b6b6f] uppercase tracking-widest mb-3">Invitar nuevo colaborador</label>
                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full bg-white border border-black/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-black/20 transition-colors text-[#111111]"
                                required
                            />
                            <div className="flex gap-2">
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="flex-1 bg-white border border-black/10 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-black/20 transition-colors text-[#111111] appearance-none cursor-pointer"
                                >
                                    <option value="MEMBER">COLABORADOR (Edición)</option>
                                    <option value="VIEWER">INVITADO (Solo lectura)</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="bg-[#111111] text-white disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-xs"
                                >
                                    {isInviting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Invitar
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    <h3 className="text-[10px] font-medium text-[#6b6b6f] uppercase tracking-widest">Colaboradores actuales</h3>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                        {/* Owner */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#f5f2ec] flex items-center justify-center font-bold text-sm overflow-hidden border border-black/10 text-[#111111]">
                                    {board.owner?.avatar ? <img src={board.owner.avatar} className="w-full h-full object-cover" /> : board.owner?.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold text-[#111111] text-sm leading-tight">{board.owner?.name}</div>
                                    <div className="text-[9px] text-[#111111] font-medium uppercase tracking-tighter bg-[#f5f2ec] px-1.5 py-0.5 rounded inline-block mt-1 border border-black/10">Dueño del tablero</div>
                                </div>
                            </div>
                        </div>

                        {/* Members */}
                        {board.members?.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/10 group hover:border-black/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#f5f2ec] flex items-center justify-center font-bold text-sm overflow-hidden border border-black/10 text-[#111111]">
                                        {m.user.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" /> : m.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-[#111111] text-sm leading-tight">{m.user.name}</div>
                                        {isOwner ? (
                                            <div className="relative mt-1">
                                                <select
                                                    value={m.role}
                                                    disabled={updatingUserId === m.userId}
                                                    onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                                                    className="bg-transparent text-[10px] font-medium text-[#6b6b6f] uppercase tracking-widest hover:text-[#111111] transition-colors outline-none cursor-pointer appearance-none pr-4"
                                                >
                                                    <option value="MEMBER">Colaborador</option>
                                                    <option value="VIEWER">Invitado</option>
                                                </select>
                                                {updatingUserId === m.userId && <Loader2 size={10} className="animate-spin absolute -right-2 top-0.5 text-[#111111]" />}
                                            </div>
                                        ) : (
                                            <div className={`text-[9px] font-medium uppercase tracking-tighter px-1.5 py-0.5 rounded inline-block mt-1 ${m.role === 'MEMBER' ? 'text-[#111111] bg-[#f5f2ec] border border-black/10' : 'text-[#6b6b6f] bg-[#f5f2ec] border border-black/10'}`}>
                                                {m.role === 'MEMBER' ? 'Colaborador' : 'Invitado'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {(isOwner || m.userId === user?.id) && (
                                    <button
                                        onClick={() => handleRemoveMember(m.userId)}
                                        className="p-2 hover:bg-[#f5f2ec] rounded-lg text-[#6b6b6f] hover:text-[#111111] transition-all opacity-0 group-hover:opacity-100"
                                        title={m.userId === user?.id ? "Salir del tablero" : "Eliminar miembro"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {(!board.members || board.members.length === 0) && (
                            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-black/10">
                                <p className="text-xs text-[#8b8b8f] italic">No hay otros colaboradores en este tablero</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
