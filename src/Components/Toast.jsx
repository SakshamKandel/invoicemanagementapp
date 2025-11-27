import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const variants = {
        initial: { opacity: 0, y: 50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    const types = {
        success: { icon: CheckCircle, bg: 'bg-green-600', border: 'border-green-700' },
        error: { icon: AlertCircle, bg: 'bg-red-600', border: 'border-red-700' },
        info: { icon: Info, bg: 'bg-black', border: 'border-gray-800' }
    };

    const style = types[type] || types.info;
    const Icon = style.icon;

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-4 px-6 py-4 text-white shadow-2xl border-l-4 ${style.bg} ${style.border} min-w-[300px]`}
        >
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold uppercase tracking-wide flex-1">{message}</p>
            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export default Toast;
