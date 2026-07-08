import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Board } from '../../types';

interface CreateBoardModalProps {
    editingBoard: Board | null;
    onClose: () => void;
    onSave: (boardForm: { title: string; description: string; bgColor: string }) => Promise<void>;
}

const colorOptions = [
    { value: '#f43f5e', label: 'Rosa' },
    { value: '#ef4444', label: 'Rojo' },
    { value: '#f97316', label: 'Naranja' },
    { value: '#f59e0b', label: 'Ámbar' },
    { value: '#84cc16', label: 'Lima' },
    { value: '#10b981', label: 'Verde' },
    { value: '#06b6d4', label: 'Cian' },
    { value: '#0ea5e9', label: 'Azul' },
    { value: '#6366f1', label: 'Índigo' },
    { value: '#d946ef', label: 'Fucsia' },
];

const defaultBoardColor = '#f43f5e';

const isHexColor = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ editingBoard, onClose, onSave }) => {
    const customColorInputRef = useRef<HTMLInputElement | null>(null);
    const [boardForm, setBoardForm] = useState({
        title: '',
        description: '',
        bgColor: defaultBoardColor
    });
    const [customColor, setCustomColor] = useState(defaultBoardColor);

    useEffect(() => {
        if (editingBoard) {
            const boardColor = editingBoard.bgColor || defaultBoardColor;
            setBoardForm({
                title: editingBoard.title,
                description: editingBoard.description || '',
                bgColor: boardColor
            });
            if (isHexColor(boardColor)) {
                setCustomColor(boardColor);
            }
        }
    }, [editingBoard]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(boardForm);
    };

    const handleCustomColorChange = (value: string) => {
        setCustomColor(value);
        setBoardForm({ ...boardForm, bgColor: value });
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
                        <div className="grid grid-cols-5 gap-3">
                            {colorOptions.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setBoardForm({ ...boardForm, bgColor: color.value })}
                                    className={`group flex flex-col items-center gap-2 text-[10px] font-medium transition-transform ${boardForm.bgColor === color.value ? 'scale-105' : 'hover:scale-105'}`}
                                    title={color.label}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${boardForm.bgColor === color.value ? 'border-black ring-2 ring-black/10' : 'border-black/10 group-hover:border-black/30'}`}
                                        style={{ backgroundColor: color.value }}
                                    />
                                    <span className={`text-[#6b6b6f] ${boardForm.bgColor === color.value ? 'text-[#111111]' : ''}`}>
                                        {color.label}
                                    </span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => customColorInputRef.current?.click()}
                                className={`group flex flex-col items-center gap-2 text-[10px] font-medium transition-transform ${isHexColor(boardForm.bgColor) && !colorOptions.some(color => color.value === boardForm.bgColor) ? 'scale-105' : 'hover:scale-105'}`}
                                title="Color personalizado"
                            >
                                <div
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${isHexColor(boardForm.bgColor) && !colorOptions.some(color => color.value === boardForm.bgColor) ? 'border-black ring-2 ring-black/10' : 'border-black/10 group-hover:border-black/30'}`}
                                    style={{ background: boardForm.bgColor }}
                                >
                                    <span className="text-[12px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">+</span>
                                </div>
                                <span className={`text-[#6b6b6f] ${isHexColor(boardForm.bgColor) && !colorOptions.some(color => color.value === boardForm.bgColor) ? 'text-[#111111]' : ''}`}>
                                    Personal
                                </span>
                                <input
                                    ref={customColorInputRef}
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => handleCustomColorChange(e.target.value)}
                                    className="sr-only"
                                    aria-label="Elegir color personalizado"
                                />
                            </button>
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
