import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification } from '../types';
import api from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export const NotificationPanel: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const socket = socketService.connect();
            if (socket) {
                socketService.joinUser(user.id);
                socket.on('notification', (newNotification: Notification) => {
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                });
            }
        }
        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('notification');
            }
        };
    }, [user]);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#0a0a0c]">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-[#141416] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notificaciones</h3>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 space-y-2">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Mail size={20} className="text-gray-600" />
                                        </div>
                                        <p className="text-sm font-medium">No hay notificaciones</p>
                                        <p className="text-xs">Te avisaremos cuando pase algo interesante</p>
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <div 
                                            key={notification.id}
                                            className={`p-4 border-b border-white/5 flex gap-3 group transition-colors ${!notification.read ? 'bg-orange-500/[0.03]' : 'hover:bg-white/[0.02]'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notification.read ? 'bg-orange-500' : 'bg-transparent'}`} />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-xs text-white font-medium leading-relaxed">
                                                    {notification.type === 'CARD_ASSIGNED' && (
                                                        <>Te han asignado a la tarjeta <span className="text-orange-400 font-bold">"{notification.payload.cardTitle}"</span></>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </p>
                                                
                                                <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <button 
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300"
                                                        >
                                                            <Check size={12} /> Marcar leída
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-red-400"
                                                    >
                                                        <Trash2 size={12} /> Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 bg-white/[0.02] border-t border-white/5">
                                    <button 
                                        className="w-full py-2 text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-all"
                                        onClick={() => {
                                            // Optional: Mark all as read
                                        }}
                                    >
                                        Limpiar todo
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
