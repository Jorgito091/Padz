import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Board } from '../../types';

interface CreateBoardModalProps {
    editingBoard: Board | null;
    onClose: () => void;
    onSave: (boardForm: { title: string; description: string; bgColor: string }) => Promise<void>;
}

const colorOptions = [
    'bg-zinc-900',
    'bg-zinc-800',
    'bg-neutral-800',
    'bg-stone-800',
    'bg-slate-800',
    'bg-white',
];

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ editingBoard, onClose, onSave }) => {
    const [boardForm, setBoardForm] = useState({
        title: '',
        description: '',
        bgColor: 'bg-white'
    });

    useEffect(() => {
        if (editingBoard) {
            setBoardForm({
                title: editingBoard.title,
                description: editingBoard.description || '',
                    bgColor: editingBoard.bgColor || 'bg-white'
            });
        }
    }, [editingBoard]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(boardForm);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
                <h2 className="text-xl font-semibold mb-4 relative z-10 text-[#111111]">
                    {editingBoard ? 'Editar Tablero' : 'Nuevo Tablero'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-[#6b6b6f] mb-1">Título</label>
                        <input
                            type="text"
                            value={boardForm.title}
                            onChange={(e) => setBoardForm({ ...boardForm, title: e.target.value })}
                            className="w-full bg-[#f5f2ec] border border-black/10 rounded-xl p-3 text-[#111111] focus:outline-none focus:border-black/20 transition-colors"
                            placeholder="Ej: Proyecto Website"
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#6b6b6f] mb-1">Descripción (Opcional)</label>
                        <textarea
                            value={boardForm.description}
                            onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
                            className="w-full bg-[#f5f2ec] border border-black/10 rounded-xl p-3 text-[#111111] focus:outline-none focus:border-black/20 h-24 resize-none transition-colors"
                            placeholder="¿De qué trata este tablero?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#6b6b6f] mb-2">Color de Fondo</label>
                        <div className="grid grid-cols-6 gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setBoardForm({ ...boardForm, bgColor: color })}
                                    className={`w-10 h-10 rounded-full ${color} border transition-colors ${boardForm.bgColor === color ? 'border-black scale-105' : 'border-black/10 hover:border-black/30'}`}
                                />
                            ))}
                        </div>
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
                            {editingBoard ? 'Guardar Cambios' : 'Crear Tablero'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
