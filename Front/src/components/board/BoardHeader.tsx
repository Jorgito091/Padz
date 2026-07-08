import React from 'react';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { Board } from '../../types';

interface BoardHeaderProps {
    board: Board;
    onBack: () => void;
    onMembersClick: () => void;
    onSettingsClick: () => void;
    className?: string;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ board, onBack, onMembersClick, onSettingsClick, className }) => {
    return (
        <div className={`flex flex-col md:flex-row md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-black/10 relative overflow-hidden transition-colors ${className ?? ''}`.trim()}>
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onBack}
                    className="p-2.5 bg-[#f5f2ec] border border-black/10 rounded-xl text-[#6b6b6f] hover:text-[#111111] transition-colors hover:bg-[#f0ece5]"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl font-semibold text-[#111111] tracking-tight">{board.title}</h1>

                        <div className="flex -space-x-2 ml-2">
                            {/* Owner */}
                            <div className="w-8 h-8 rounded-full border border-black/10 overflow-hidden bg-[#f5f2ec] flex items-center justify-center text-[10px] font-bold text-[#111111]" title={`Dueño: ${board.owner?.name}`}>
                                {board.owner?.avatar ? (
                                    <img src={board.owner.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{board.owner?.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            {/* Members */}
                            {board.members?.map(m => (
                                <div key={m.id} className="w-8 h-8 rounded-full border border-black/10 overflow-hidden bg-[#f5f2ec] flex items-center justify-center text-[10px] font-bold text-[#111111]" title={m.user.name}>
                                    {m.user.avatar ? (
                                        <img src={m.user.avatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{m.user.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={onMembersClick}
                                className="w-8 h-8 rounded-full border border-black/10 bg-white hover:bg-[#f5f2ec] flex items-center justify-center transition-colors text-[#6b6b6f] hover:text-[#111111]"
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
                className="p-2.5 bg-white border border-black/10 rounded-xl text-[#6b6b6f] hover:text-[#111111] transition-colors hover:bg-[#f5f2ec] flex items-center gap-2 font-medium"
                title="Configuración del tablero"
            >
                <Settings size={20} />
                <span className="text-sm hidden sm:inline">Ajustes</span>
            </button>
        </div>
    );
};
