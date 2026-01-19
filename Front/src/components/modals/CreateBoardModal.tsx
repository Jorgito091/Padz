import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Board } from '../../types';

interface CreateBoardModalProps {
    editingBoard: Board | null;
    onClose: () => void;
    onSave: (boardForm: { title: string; description: string; bgColor: string }) => Promise<void>;
}

const colorOptions = [
    'from-orange-600 to-orange-500',
    'from-blue-600 to-blue-500',
    'from-emerald-600 to-emerald-500',
    'from-purple-600 to-purple-500',
    'from-pink-600 to-pink-500',
    'from-zinc-800 to-zinc-900',
];

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ editingBoard, onClose, onSave }) => {
    const [boardForm, setBoardForm] = useState({
        title: '',
        description: '',
        bgColor: 'from-orange-600 to-orange-500'
    });

    useEffect(() => {
        if (editingBoard) {
            setBoardForm({
                title: editingBoard.title,
                description: editingBoard.description || '',
                bgColor: editingBoard.bgColor || 'from-orange-600 to-orange-500'
            });
        }
    }, [editingBoard]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(boardForm);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${boardForm.bgColor} opacity-5`} />

                <h2 className="text-xl font-bold mb-4 relative z-10">
                    {editingBoard ? 'Editar Tablero' : 'Nuevo Tablero'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
                        <input
                            type="text"
                            value={boardForm.title}
                            onChange={(e) => setBoardForm({ ...boardForm, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                            placeholder="Ej: Proyecto Website"
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Descripción (Opcional)</label>
                        <textarea
                            value={boardForm.description}
                            onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 h-24 resize-none transition-all"
                            placeholder="¿De qué trata este tablero?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Color de Fondo</label>
                        <div className="grid grid-cols-6 gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setBoardForm({ ...boardForm, bgColor: color })}
                                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} transition-all ${boardForm.bgColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
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
                            {editingBoard ? 'Guardar Cambios' : 'Crear Tablero'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
