import React from 'react';
import type { Unit } from '../types';
import { Car, Users } from 'lucide-react';

interface UnitNodeProps {
    unit: Unit;
    onClick: (unit: Unit) => void;
}

export const UnitNode: React.FC<UnitNodeProps> = ({ unit, onClick }) => {
    return (
        <div
            onClick={() => onClick(unit)}
            className="p-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 hover:border-slate-500 transition-all flex flex-col gap-2 shadow-sm active:scale-95"
        >
            <h3 className="font-semibold text-sm text-slate-100">{unit.name}</h3>
            <div className="flex gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-full">
                    <Car size={12} /> {unit.fleet.length}
                </span>
                <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-full">
                    <Users size={12} /> {unit.personnel.length}
                </span>
            </div>
        </div>
    );
};
