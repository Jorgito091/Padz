import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
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

    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            isDark ? 'bg-[#111111]' : 'bg-[#f5f2ec]'
        } px-4 py-6 md:py-10`}>
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6">
                <button
                    onClick={toggleTheme}
                    className={`p-3 rounded-full transition-colors ${
                        isDark 
                            ? 'bg-[#2a2a2a] text-yellow-400 hover:bg-[#3a3a3a]'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>

            <div className={`mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border transition-colors duration-300 ${
                isDark 
                    ? 'border-white/10 bg-[#1a1a1a] shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
                    : 'border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]'
            } md:grid-cols-[1.1fr_0.9fr]`}>
                {/* Left Side - Info Panel */}
                <div className={`flex flex-col items-start justify-start border-b transition-colors duration-300 ${
                    isDark 
                        ? 'border-white/10 bg-[#0a0a0a] text-white'
                        : 'border-black/10 bg-[#111111] text-white'
                } p-8 md:border-b-0 md:border-r md:p-12`}>
                    <Logo size={64} />
                    <h1 className="mt-12 text-3xl md:text-4xl font-semibold leading-tight max-w-md">
                        Un lugar para organizar ideas.
                    </h1>
                </div>

                {/* Right Side - Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`flex items-center justify-center p-8 md:p-12 ${
                        isDark ? 'bg-[#1a1a1a]' : 'bg-white'
                    } transition-colors duration-300`}
                >
                    <div className="w-full max-w-md">
                        {/* Header */}
                        <div className="mb-8 space-y-2">
                            <h2 className={`text-3xl font-semibold ${
                                isDark ? 'text-white' : 'text-[#111111]'
                            }`}>
                                Bienvenido
                            </h2>
                            <p className={isDark ? 'text-gray-400' : 'text-[#6b6b6f]'}>
                                Inicia sesión para entrar a tu espacio de trabajo.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Alert */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`${
                                        isDark
                                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-600'
                                    } border p-3 rounded-xl flex items-center gap-2 text-sm`}
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ml-1 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Email
                                </label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                                        isDark
                                            ? 'text-gray-600 group-focus-within:text-orange-400'
                                            : 'text-gray-400 group-focus-within:text-orange-500'
                                    }`}>
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`block w-full pl-11 pr-4 py-3 rounded-xl border transition-colors focus:outline-none ${
                                            isDark
                                                ? 'bg-[#2a2a2a] border-white/10 text-white placeholder:text-gray-500 focus:border-white/30'
                                                : 'bg-[#f5f2ec] border-black/10 text-[#111111] placeholder:text-[#8b8b8f] focus:border-black/30'
                                        }`}
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className={`text-sm font-medium ${
                                        isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Contraseña
                                    </label>
                                    <a href="#" className={`text-xs underline underline-offset-4 transition-colors ${
                                        isDark
                                            ? 'text-gray-400 decoration-white/20 hover:decoration-white/40'
                                            : 'text-[#111111] decoration-black/30 hover:decoration-black'
                                    }`}>
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                                        isDark
                                            ? 'text-gray-600 group-focus-within:text-orange-400'
                                            : 'text-gray-400 group-focus-within:text-orange-500'
                                    }`}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`block w-full pl-11 pr-4 py-3 rounded-xl border transition-colors focus:outline-none ${
                                            isDark
                                                ? 'bg-[#2a2a2a] border-white/10 text-white placeholder:text-gray-500 focus:border-white/30'
                                                : 'bg-[#f5f2ec] border-black/10 text-[#111111] placeholder:text-[#8b8b8f] focus:border-black/30'
                                        }`}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                                    isDark
                                        ? 'bg-white text-[#111111] hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none'
                                        : 'bg-[#111111] text-white hover:bg-black disabled:opacity-70 disabled:pointer-events-none'
                                }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Iniciar Sesión"
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <p className={`mt-8 text-center text-sm ${
                            isDark ? 'text-gray-400' : 'text-[#6b6b6f]'
                        }`}>
                            ¿No tienes cuenta?{' '}
                            <Link to="/register" className={`underline underline-offset-4 transition-colors font-medium ${
                                isDark
                                    ? 'text-white decoration-white/20 hover:decoration-white/40'
                                    : 'text-[#111111] decoration-black/30 hover:decoration-black'
                            }`}>
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
