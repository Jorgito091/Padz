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
        <div className={`relative mb-8 overflow-hidden rounded-[28px] border border-white/30 bg-white/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-colors ${className ?? ''}`.trim()}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent pointer-events-none" />
            <div
                className="absolute left-0 top-0 h-full w-1.5"
                style={{ backgroundColor: board.bgColor || '#f43f5e' }}
            />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onBack}
                    className="p-2.5 bg-white/70 border border-black/10 rounded-xl text-[#6b6b6f] hover:text-[#111111] transition-colors hover:bg-white"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl font-semibold text-[#111111] tracking-tight">{board.title}</h1>

                        <div className="flex -space-x-2 ml-2">
                            {/* Owner */}
                            <div className="w-8 h-8 rounded-full border border-black/10 overflow-hidden bg-white/80 flex items-center justify-center text-[10px] font-bold text-[#111111]" title={`Dueño: ${board.owner?.name}`}>
                                {board.owner?.avatar ? (
                                    <img src={board.owner.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{board.owner?.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            {/* Members */}
                            {board.members?.map(m => (
                                <div key={m.id} className="w-8 h-8 rounded-full border border-black/10 overflow-hidden bg-white/80 flex items-center justify-center text-[10px] font-bold text-[#111111]" title={m.user.name}>
                                    {m.user.avatar ? (
                                        <img src={m.user.avatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{m.user.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={onMembersClick}
                                className="w-8 h-8 rounded-full border border-black/10 bg-white/80 hover:bg-white flex items-center justify-center transition-colors text-[#6b6b6f] hover:text-[#111111]"
                                title="Gestionar miembros"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                    {board.description && (
                        <p className="text-sm text-[#6b6b6f] mt-1 max-w-2xl line-clamp-1">{board.description}</p>
                    )}
                </div>
            </div>
            </div>

            <button
                onClick={onSettingsClick}
                className="relative z-10 p-2.5 bg-white/80 border border-black/10 rounded-xl text-[#6b6b6f] hover:text-[#111111] transition-colors hover:bg-white flex items-center gap-2 font-medium"
                title="Configuración del tablero"
            >
                <Settings size={20} />
                <span className="text-sm hidden sm:inline">Ajustes</span>
            </button>
        </div>
    );
};
