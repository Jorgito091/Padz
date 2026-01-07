import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
    return (
        <motion.div
            className={`relative flex items-center justify-center ${className}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
            whileHover={{ scale: 1.1, rotate: -5 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_4px_12px_rgba(249,115,22,0.4)]"
            >
                {/* Cuerpo de la P - Estilo Comic/Redondeado */}
                <path
                    d="M30 20C30 14.4772 34.4772 10 40 10H65C81.5685 10 95 23.4315 95 40C95 56.5685 81.5685 70 65 70H45V85C45 90.5228 40.5228 95 35 95C29.4772 95 25 90.5228 25 85V25C25 22.2386 27.2386 20 30 20Z"
                    fill="url(#logo-gradient)"
                />

                {/* Espacio interno de la P */}
                <path
                    d="M45 25H65C73.2843 25 80 31.7157 80 40C80 48.2843 73.2843 55 65 55H45V25Z"
                    fill="#121212"
                />

                {/* Brillo animado */}
                <motion.circle
                    cx="40"
                    cy="25"
                    r="4"
                    fill="white"
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                <defs>
                    <linearGradient id="logo-gradient" x1="25" y1="10" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#fb923c" /> {/* orange-400 */}
                        <stop offset="1" stopColor="#f97316" /> {/* orange-500 */}
                    </linearGradient>
                </defs>
            </svg>
        </motion.div>
    );
};

export default Logo;
