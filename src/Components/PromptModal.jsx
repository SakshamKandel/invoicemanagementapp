import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PromptModal = ({ isOpen, onClose, onConfirm, title, message, placeholder = "Enter text..." }) => {
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(value);
        setValue('');
        onClose();
    };

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
                        <div className="bg-brand-600 p-4 flex justify-between items-center">
                            <h3 className="text-white text-lg font-black uppercase tracking-tighter">{title}</h3>
                            <button onClick={onClose} className="text-white hover:opacity-70">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">{message}</p>

                            <input
                                autoFocus
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 text-sm font-bold focus:border-brand-600 outline-none transition-colors"
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 border-2 border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-600 transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PromptModal;
