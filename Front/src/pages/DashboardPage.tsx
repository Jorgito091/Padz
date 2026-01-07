import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

// Types
interface Card { id: number; content: string; }
interface List { id: number; title: string; cards: Card[]; }
interface Board { id: number; title: string; }

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [view, setView] = useState<'dashboard' | 'board'>('dashboard');
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const boards: Board[] = [
        { id: 1, title: '🚀 Proyecto Frontend' },
        { id: 2, title: '💻 Backend Padz' },
        { id: 3, title: '🏖️ Personal' }
    ];

    const lists: List[] = [
        {
            id: 101,
            title: 'Por Hacer',
            cards: [{ id: 1, content: 'Diseñar UI' }, { id: 2, content: 'Integrar API' }]
        },
        {
            id: 102,
            title: 'En Proceso',
            cards: [{ id: 3, content: 'Setup React + TS' }]
        }
    ];

    const handleBoardClick = (board: Board) => {
        setSelectedBoard(board);
        setView('board');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            {/* Background blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 flex justify-between items-center px-8 py-4 mb-8">
                <div className="flex items-center gap-8">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setView('dashboard')}
                    >
                        <Logo size={32} />
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent group-hover:from-orange-400 group-hover:to-orange-300 transition-all">
                            Padz
                        </span>
                    </div>
                    <div className="hidden md:flex gap-4">
                        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-500 shadow-lg shadow-orange-950/20 transition-all flex items-center gap-2">
                            <Plus size={18} /> Crear Tablero
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-white">{user?.name}</span>
                        <span className="text-xs text-gray-400">{user?.email}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all"
                        title="Cerrar sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pb-12 relative z-10">
                <AnimatePresence mode="wait">
                    {view === 'dashboard' ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <LayoutGrid className="text-orange-500" />
                                <h1 className="text-3xl font-bold">Mis Tableros</h1>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {loading ? (
                                    [1, 2, 3, 4].map((n) => (
                                        <div key={n} className="h-40 rounded-2xl bg-white/5 border border-white/10 shadow-xl animate-pulse opacity-50" />
                                    ))
                                ) : (
                                    <>
                                        {boards.map((board) => (
                                            <motion.div
                                                key={board.id}
                                                whileHover={{ scale: 1.02, y: -5 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleBoardClick(board)}
                                                className="h-40 p-6 backdrop-blur-xl bg-white/5 border border-white/5 hover:border-orange-500/30 rounded-2xl cursor-pointer flex flex-col justify-end shadow-xl transition-all group"
                                            >
                                                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">{board.title}</h3>
                                            </motion.div>
                                        ))}
                                        <div className="h-40 p-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-orange-500/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white group">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all">
                                                <Plus />
                                            </div>
                                            <span className="font-medium">Nuevo Tablero</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="board"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="p-2.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-3xl font-bold">{selectedBoard?.title}</h1>
                            </div>

                            <div className="flex gap-6 overflow-x-auto pb-6 items-start">
                                {lists.map((list) => (
                                    <div key={list.id} className="min-w-[320px] max-w-[320px] backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-2xl">
                                        <div className="flex justify-between items-center mb-5 px-1">
                                            <h3 className="font-bold text-white/90">{list.title}</h3>
                                            <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"><Plus size={18} /></button>
                                        </div>
                                        <div className="space-y-3">
                                            {list.cards.map((card) => (
                                                <div key={card.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-orange-500/40 cursor-grab active:cursor-grabbing transition-all shadow-sm text-gray-300">
                                                    {card.content}
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full mt-5 py-2.5 px-3 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-2">
                                            <Plus size={16} /> Añadir tarjeta
                                        </button>
                                    </div>
                                ))}

                                <button className="min-w-[320px] backdrop-blur-xl bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-5 text-left font-semibold text-gray-400 hover:text-white transition-all border-dashed border-2 border-white/10 flex items-center gap-3">
                                    <Plus size={20} /> Añadir lista
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DashboardPage;
