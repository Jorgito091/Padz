import React from 'react';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { Board } from '../../types';

interface BoardHeaderProps {
    board: Board;
    onBack: () => void;
    onMembersClick: () => void;
    onSettingsClick: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ board, onBack, onMembersClick, onSettingsClick }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10 relative overflow-hidden transition-all">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onBack}
                    className="p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all hover:bg-white/10"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl font-bold text-white tracking-tight">{board.title}</h1>

                        <div className="flex -space-x-2 ml-2">
                            {/* Owner */}
                            <div className="w-8 h-8 rounded-full border-2 border-[#1a1a1c] overflow-hidden bg-orange-600 flex items-center justify-center text-[10px] font-bold shadow-lg" title={`Dueño: ${board.owner?.name}`}>
                                {board.owner?.avatar ? (
                                    <img src={board.owner.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{board.owner?.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            {/* Members */}
                            {board.members?.map(m => (
                                <div key={m.id} className="w-8 h-8 rounded-full border-2 border-[#1a1a1c] overflow-hidden bg-zinc-700 flex items-center justify-center text-[10px] font-bold shadow-lg" title={m.user.name}>
                                    {m.user.avatar ? (
                                        <img src={m.user.avatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{m.user.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={onMembersClick}
                                className="w-8 h-8 rounded-full border-2 border-[#1a1a1c] bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shadow-lg text-gray-400 hover:text-white"
                                title="Gestionar miembros"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                    {board.description && (
                        <p className="text-sm text-gray-400 mt-1 max-w-2xl line-clamp-1">{board.description}</p>
                    )}
                </div>
            </div>

            <button
                onClick={onSettingsClick}
                className="p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all hover:bg-white/10 flex items-center gap-2 font-medium"
                title="Configuración del tablero"
            >
                <Settings size={20} />
                <span className="text-sm hidden sm:inline">Ajustes</span>
            </button>
        </div>
    );
};
