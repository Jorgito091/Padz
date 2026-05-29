import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import searchService from '../services/search';
import api from '../services/api';

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [boardId, setBoardId] = useState('');
  const [isDone, setIsDone] = useState('');

  const [boards, setBoards] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [results, setResults] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const resp = await api.get('/boards');
        setBoards(resp.data || []);
      } catch (err) {
        console.error('Failed to load boards', err);
      }
    };
    loadBoards();
  }, []);

  useEffect(() => {
    const loadBoardRelated = async () => {
      if (!boardId) {
        setLabels([]);
        setMembers([]);
        return;
      }
      try {
        const [lResp, mResp] = await Promise.all([
          api.get(`/labels/board/${boardId}`),
          api.get(`/members/${boardId}`)
        ]);
        setLabels(lResp.data || []);
        setMembers(mResp.data || []);
      } catch (err) {
        console.error('Failed to load labels/members', err);
        setLabels([]);
        setMembers([]);
      }
    };
    loadBoardRelated();
  }, [boardId]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params: any = { q, page, limit: 20 };
      if (selectedLabelIds.length) params.labelIds = selectedLabelIds.join(',');
      if (assignedTo) params.assignedTo = assignedTo;
      if (boardId) params.boardId = boardId;
      if (isDone) params.isDone = isDone;
      const resp = await searchService.searchCards(params);
      setResults(resp.data.data || []);
      setMeta(resp.data.meta || null);
    } catch (err) {
      console.error(err);
      setResults([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // run search when page changes
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleLabel = (id: string) => {
    setSelectedLabelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Búsqueda avanzada de tarjetas</h1>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 max-w-3xl">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Texto libre (título/descripcion)" className="p-2 rounded bg-white/5" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={boardId} onChange={e => setBoardId(e.target.value)} className="p-2 rounded bg-white/5">
            <option value="">Seleccionar board (opcional)</option>
            {boards.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>

          <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="p-2 rounded bg-white/5">
            <option value="">Asignado a (opcional)</option>
            {members.map(m => (
              <option key={m.userId} value={m.userId}>{m.user.name}</option>
            ))}
          </select>

          <select value={isDone} onChange={e => setIsDone(e.target.value)} className="p-2 rounded bg-white/5">
            <option value="">Cualquiera</option>
            <option value="true">Hecho</option>
            <option value="false">Pendiente</option>
          </select>
        </div>

        <div>
          <div className="text-sm text-gray-300 mb-2">Etiquetas (haz clic para seleccionar):</div>
          <div className="flex flex-wrap gap-2">
            {labels.map((l: any) => {
              const selected = selectedLabelIds.includes(l.id);
              return (
                <button key={l.id} type="button" onClick={() => toggleLabel(l.id)} className={`px-3 py-1 rounded-full text-xs font-semibold ${selected ? 'ring-2 ring-orange-400' : ''}`} style={{ background: l.color, color: '#000' }}>
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-orange-600 rounded">Buscar</button>
          <button type="button" className="px-4 py-2 bg-white/5 rounded" onClick={() => { setQ(''); setSelectedLabelIds([]); setAssignedTo(''); setBoardId(''); setIsDone(''); setPage(1); setResults([]); setMeta(null); }}>Limpiar</button>
        </div>
      </form>

      <div className="mt-6">
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <>
            <div className="text-sm text-gray-400 mb-3">{meta ? `Resultados: ${meta.total} — Página ${meta.page}` : ''}</div>
            <div className="grid gap-3">
              {results.map((card) => (
                <div key={card.id} className="p-3 bg-white/5 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">{card.title}</div>
                      <div className="text-sm text-gray-300">{card.description}</div>
                      <div className="text-xs text-gray-400 mt-2">Lista: {card.list?.title} — BoardId: {card.list?.boardId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Actualizado: {new Date(card.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {card.labels?.map((l: any) => (
                      <span key={l.label.id} className="px-2 py-1 text-xs rounded" style={{ background: l.label.color, color: '#000' }}>{l.label.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {meta && meta.total > meta.limit && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button className="px-3 py-1 bg-white/5 rounded" onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
                <div className="text-sm text-gray-300">{meta.page} / {Math.ceil(meta.total / meta.limit)}</div>
                <button className="px-3 py-1 bg-white/5 rounded" onClick={() => setPage(p => p + 1)}>Siguiente</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
