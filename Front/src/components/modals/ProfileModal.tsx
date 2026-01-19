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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <UserCog className="text-orange-500" /> Perfil de Usuario
                </h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={userForm.name}
                            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL (Opcional)</label>
                        <input
                            type="text"
                            value={userForm.avatar}
                            onChange={(e) => setUserForm({ ...userForm, avatar: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-orange-900/20"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                    <div className="border-t border-white/10 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut size={18} /> Cerrar Sesión
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
