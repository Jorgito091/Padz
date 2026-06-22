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
            whileHover={{ scale: 1.04 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M30 20C30 14.4772 34.4772 10 40 10H65C81.5685 10 95 23.4315 95 40C95 56.5685 81.5685 70 65 70H45V85C45 90.5228 40.5228 95 35 95C29.4772 95 25 90.5228 25 85V25C25 22.2386 27.2386 20 30 20Z"
                    fill="#f97316"
                />

                <path
                    d="M45 25H65C73.2843 25 80 31.7157 80 40C80 48.2843 73.2843 55 65 55H45V25Z"
                    fill="#0b0b0c"
                />

                <circle
                    cx="40"
                    cy="25"
                    r="4"
                    fill="white"
                    opacity="0.55"
                />
            </svg>
        </motion.div>
    );
};

export default Logo;
