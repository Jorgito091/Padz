import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al iniciar sesión. Por favor verifica tus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f2ec] text-[#111111] px-4 py-6 md:py-10">
            <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] md:grid-cols-[1.1fr_0.9fr]">
                <div className="flex flex-col justify-between border-b border-black/10 bg-[#111111] p-8 text-white md:border-b-0 md:border-r md:p-12">
                    <div className="flex items-center gap-4">
                        <Logo size={72} />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-white/45">Padz</p>
                            <h1 className="mt-2 text-4xl font-semibold leading-tight">Orden simple para equipos reales.</h1>
                        </div>
                    </div>
                    <div className="max-w-md space-y-4">
                        <p className="text-sm leading-6 text-white/70">Una interfaz limpia, sin ruido visual, para entrar, crear y mover trabajo sin distracciones.</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Diseño</p>
                                <p className="mt-2 text-sm text-white/80">Minimal, plano y consistente.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Foco</p>
                                <p className="mt-2 text-sm text-white/80">Menos sombra, menos ruido.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center p-8 md:p-12"
                >
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="text-3xl font-semibold text-[#111111] mb-2">Bienvenido</h2>
                            <p className="text-[#6b6b6f]">Inicia sesión para entrar a tu espacio de trabajo.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-orange-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-[#f5f2ec] border border-black/10 rounded-xl text-[#111111] placeholder:text-[#8b8b8f] focus:outline-none focus:border-black/30 transition-colors"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-gray-300">Contraseña</label>
                                <a href="#" className="text-xs text-[#111111] underline underline-offset-4 decoration-black/30 hover:decoration-black transition-colors">¿Olvidaste tu contraseña?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-orange-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-[#f5f2ec] border border-black/10 rounded-xl text-[#111111] placeholder:text-[#8b8b8f] focus:outline-none focus:border-black/30 transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#111111] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Iniciar Sesión"
                            )}
                        </button>
                    </form>

                        <p className="mt-8 text-center text-[#6b6b6f]">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-[#111111] underline underline-offset-4 decoration-black/30 hover:decoration-black transition-colors">
                            Regístrate gratis
                        </Link>
                    </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
