import React from 'react';
import type { Building, Unit } from '../types';
import { UnitNode } from './UnitNode';
import { MapPin } from 'lucide-react';

interface BuildingCardProps {
    building: Building;
    onUnitClick: (unit: Unit) => void;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({ building, onUnitClick }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3 min-w-[250px]">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-400">
                    <MapPin size={16} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-200 text-sm leading-tight">{building.name}</h3>
                    <p className="text-xs text-slate-500">{building.city}</p>
                </div>
            </div>

            <div className="flex flex-col gap-2 relative">
                {/* Vertical line connector logic could go here if we want strictly strictly branched look, 
              but standard flex column is often cleaner. 
              We can add a left border to simulate branch. */}
                <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-800 -z-10" />

                {building.units.map(unit => (
                    <UnitNode key={unit.id} unit={unit} onClick={onUnitClick} />
                ))}
            </div>
        </div>
    );
};
