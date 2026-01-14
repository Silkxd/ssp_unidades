import React from 'react';
import type { Unit } from '../types';
import { X, Car, CircleDot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnitDetailsDrawerProps {
    isOpen: boolean;
    unit?: Unit;
    onClose: () => void;
}

export const UnitDetailsDrawer: React.FC<UnitDetailsDrawerProps> = ({ isOpen, unit, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && unit && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-[400px] max-w-[90vw] bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex justify-between items-start z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-1 leading-snug">{unit.name}</h2>
                                <div className="flex flex-wrap gap-2 text-sm text-slate-500 mt-2">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 font-medium">ID: {unit.originalId}</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 font-medium">AISP: {unit.aisp}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Fleet Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-slate-700">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                        <Car size={18} />
                                    </div>
                                    <h3 className="uppercase tracking-wider text-sm font-bold">Frota disponível ({unit.fleet.length})</h3>
                                </div>

                                <div className="grid gap-3">
                                    {unit.fleet.length === 0 && (
                                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                                            Nenhuma viatura ou veículo registrado.
                                        </div>
                                    )}
                                    {unit.fleet.map(v => (
                                        <div key={v.id} className="group flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                            <div className="bg-blue-50 p-2.5 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Car size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modelo</span>
                                                    <p className="text-slate-800 font-bold text-sm truncate">{v.model}</p>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono tracking-wide group-hover:bg-white group-hover:border-blue-100">{v.plate}</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipo</span>
                                                        <span className="text-xs text-slate-600 font-medium">{v.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
