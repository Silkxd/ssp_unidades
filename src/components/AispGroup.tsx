import React, { useState } from 'react';
import type { Aisp, Unit } from '../types';
import { BuildingCard } from './BuildingCard';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

interface AispGroupProps {
    aisp: Aisp;
    onUnitClick: (unit: Unit) => void;
}

export const AispGroup: React.FC<AispGroupProps> = ({ aisp, onUnitClick }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="mb-8">
            <div
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-4 bg-slate-900 border-l-4 border-blue-500 p-4 rounded-r-lg cursor-pointer hover:bg-slate-800 transition-colors mb-4 group"
            >
                <button className="text-slate-400 group-hover:text-white">
                    {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                <div className="flex-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="text-blue-500" size={20} />
                        {aisp.name}
                    </h2>
                    <div className="flex gap-6 mt-1 text-sm">
                        {aisp.delegatePC && (
                            <div className="flex items-center gap-1 text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-pc"></span>
                                <span className="font-medium text-slate-300">PC:</span> {aisp.delegatePC}
                            </div>
                        )}
                        {aisp.commanderPM && (
                            <div className="flex items-center gap-1 text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-pm"></span>
                                <span className="font-medium text-slate-300">PM:</span> {aisp.commanderPM}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 border-l border-slate-800 ml-6">
                            {aisp.buildings.map(building => (
                                <BuildingCard key={building.id} building={building} onUnitClick={onUnitClick} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
