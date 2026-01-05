import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock types
interface Card {
  id: number;
  content: string;
}

interface List {
  id: number;
  title: string;
  cards: Card[];
}

interface Board {
  id: number;
  title: string;
}

export default function App() {
  const [view, setView] = useState<'dashboard' | 'board'>('dashboard');
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
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
    },
    {
      id: 103,
      title: 'Hecho',
      cards: [{ id: 4, content: 'Estructura Vanilla' }]
    }
  ];

  const handleBoardClick = (board: Board) => {
    setSelectedBoard(board);
    setView('board');
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar glass sticky top-0 z-50 flex justify-between items-center px-8 py-4 mb-8">
        <div className="text-2xl font-bold bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">
          Padz
        </div>
        <div className="hidden md:flex gap-4">
          <button className="px-4 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accentHover shadow-lg shadow-accent/20 transition-all flex items-center gap-2">
            <Plus size={18} /> Crear Tablero
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <LayoutGrid className="text-accent" />
                <h1 className="text-3xl font-bold">Mis Tableros</h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                  [1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-32 rounded-xl skeleton shadow-xl" />
                  ))
                ) : (
                  <>
                    {boards.map((board) => (
                      <motion.div
                        key={board.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBoardClick(board)}
                        className="h-32 p-6 glass glass-hover cursor-pointer flex flex-col justify-end shadow-xl"
                      >
                        <h3 className="text-xl font-semibold">{board.title}</h3>
                      </motion.div>
                    ))}
                    <div className="h-32 p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-accent/50 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-2 text-textSecondary hover:text-white group">
                      <Plus className="group-hover:text-accent" />
                      <span>Nuevo Tablero</span>
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
                  className="p-2 glass glass-hover rounded-lg text-textSecondary"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-bold">{selectedBoard?.title}</h1>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-6 items-start">
                {lists.map((list) => (
                  <div key={list.id} className="min-w-[300px] max-w-[300px] glass rounded-xl p-4 shadow-2xl">
                    <div className="flex justify-between items-center mb-4 px-1">
                      <h3 className="font-bold">{list.title}</h3>
                      <button className="text-textSecondary hover:text-white"><Plus size={16} /></button>
                    </div>
                    <div className="space-y-3">
                      {list.cards.map((card) => (
                        <div key={card.id} className="bg-[#1e293b]/50 p-3 rounded-lg border border-white/5 hover:border-accent/40 cursor-grab active:cursor-grabbing transition-all shadow-sm">
                          {card.content}
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-4 p-2 text-left text-sm text-textSecondary hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      + Añadir tarjeta
                    </button>
                  </div>
                ))}

                <button className="min-w-[300px] glass bg-white/5 hover:bg-white/10 rounded-xl p-4 text-left font-semibold text-textSecondary hover:text-white transition-all border-dashed border-2 border-white/10">
                  + Añadir lista
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
