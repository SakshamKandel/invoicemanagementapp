import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirm", isDestructive = false }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white border-4 border-brand-600 shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
                                <p className="text-sm text-gray-500 font-medium">{message}</p>
                            </div>

                            <div className="flex gap-3 w-full pt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { onConfirm(); onClose(); }}
                                    className={`flex-1 px-4 py-3 text-white text-xs font-bold uppercase tracking-widest transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-brand-600'
                                        }`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
