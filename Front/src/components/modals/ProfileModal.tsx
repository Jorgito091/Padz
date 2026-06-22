import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface ProfileModalProps {
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
    const { user, logout, updateUser } = useAuth();
    const [userForm, setUserForm] = useState({ name: '', avatar: '' });

    useEffect(() => {
        if (user) {
            setUserForm({ name: user.name, avatar: user.avatar || '' });
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.put('/auth/profile', userForm);
            const { user: updatedUser } = response.data;
            updateUser(updatedUser);
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-[#111111]">
                    <UserCog className="text-[#111111]" /> Perfil de Usuario
                </h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#6b6b6f] mb-1">Nombre</label>
                        <input
                            type="text"
                            value={userForm.name}
                            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                            className="w-full bg-[#f5f2ec] border border-black/10 rounded-xl p-3 text-[#111111] focus:outline-none focus:border-black/20 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#6b6b6f] mb-1">Avatar URL (Opcional)</label>
                        <input
                            type="text"
                            value={userForm.avatar}
                            onChange={(e) => setUserForm({ ...userForm, avatar: e.target.value })}
                            className="w-full bg-[#f5f2ec] border border-black/10 rounded-xl p-3 text-[#111111] focus:outline-none focus:border-black/20 transition-colors"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-[#f5f2ec] rounded-lg text-[#6b6b6f] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#111111] text-white rounded-lg font-medium transition-colors"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                    <div className="border-t border-black/10 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#f5f2ec] text-[#6b6b6f] hover:text-[#111111] rounded-lg transition-colors border border-black/10 hover:border-black/20"
                        >
                            <LogOut size={18} /> Cerrar Sesión
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
