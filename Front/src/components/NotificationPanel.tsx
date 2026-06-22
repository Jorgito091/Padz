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
                className="p-2 hover:bg-[#efe9df] rounded-xl text-[#6b6b6f] hover:text-[#111111] transition-all relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#111111] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#f5f2ec]">
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
                            className="absolute right-0 mt-2 w-80 bg-white border border-black/10 rounded-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-black/10 flex justify-between items-center bg-[#f5f2ec]">
                                <h3 className="text-sm font-semibold text-[#111111] uppercase tracking-wider">Notificaciones</h3>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white rounded-lg text-[#6b6b6f] hover:text-[#111111]"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-[#6b6b6f] space-y-2">
                                        <div className="w-12 h-12 bg-[#f5f2ec] rounded-full flex items-center justify-center mx-auto mb-4 border border-black/10">
                                            <Mail size={20} className="text-[#8b8b8f]" />
                                        </div>
                                        <p className="text-sm font-medium">No hay notificaciones</p>
                                        <p className="text-xs">Te avisaremos cuando pase algo interesante</p>
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <div 
                                            key={notification.id}
                                            className={`p-4 border-b border-black/5 flex gap-3 group transition-colors ${!notification.read ? 'bg-[#f5f2ec]' : 'hover:bg-[#faf8f4]'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notification.read ? 'bg-[#111111]' : 'bg-transparent'}`} />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-xs text-[#111111] font-medium leading-relaxed">
                                                    {notification.type === 'CARD_ASSIGNED' && (
                                                        <>Te han asignado a la tarjeta <span className="text-[#111111] font-semibold">"{notification.payload.cardTitle}"</span></>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-[#8b8b8f] uppercase font-medium tracking-widest">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </p>
                                                
                                                <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <button 
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="flex items-center gap-1 text-[10px] font-medium text-[#111111] hover:underline"
                                                        >
                                                            <Check size={12} /> Marcar leída
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="flex items-center gap-1 text-[10px] font-medium text-[#6b6b6f] hover:text-[#111111]"
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
                                <div className="p-3 bg-[#f5f2ec] border-t border-black/10">
                                    <button 
                                        className="w-full py-2 text-[10px] font-medium text-[#6b6b6f] hover:text-[#111111] uppercase tracking-widest transition-all"
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
