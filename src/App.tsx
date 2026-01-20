import { useEffect, useState } from 'react';
import type { Aisp, City, Building, Unit } from './types';
import { fetchAndParseData } from './services/excelService';
import { UnitDetailsDrawer } from './components/UnitDetailsDrawer';
import { Map, ChevronRight, Building2, Car, IdCard, Users } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const [data, setData] = useState<Aisp[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAisp, setSelectedAisp] = useState<Aisp | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchAndParseData();
        // Sort by AISP IDs naturally
        result.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAispSelect = (aisp: Aisp) => {
    setSelectedAisp(aisp);
    setSelectedCity(null);
    setSelectedBuilding(null); // Reset downstream
    setSelectedUnit(null);
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setSelectedBuilding(null);
    setSelectedUnit(null);
  };

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedUnit(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10 flex-shrink-0">
        <h1 className="text-2xl font-bold text-blue-950 mb-1">Estrutura Organizacional SSP-PI</h1>
        <p className="text-slate-500 text-sm">Visualizador de hierarquia administrativa, unidades e recursos.</p>
      </header>

      <main className="flex-1 flex overflow-x-auto overflow-y-hidden p-6 gap-6">

        {/* Column 1: AISPs */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Map size={18} className="text-blue-600" />
              Territórios (AISP)
              <span className="ml-auto bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{data.length}</span>
            </h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {data.map(aisp => (
              <button
                key={aisp.id}
                onClick={() => handleAispSelect(aisp)}
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all group mb-1",
                  selectedAisp?.id === aisp.id
                    ? "bg-[#0f172a] text-white shadow-md"
                    : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <span className="font-medium truncate">{aisp.name}</span>
                <ChevronRight size={16} className={clsx(
                  "opacity-0 -translate-x-2 transition-all",
                  selectedAisp?.id === aisp.id ? "opacity-100 translate-x-0 text-slate-400" : "group-hover:opacity-50 group-hover:translate-x-0"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Cities */}
        {selectedAisp && (
          <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Map size={18} className="text-slate-400" />
                Municípios
                <span className="ml-auto bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full">{selectedAisp.cities.length}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 truncate">Em: {selectedAisp.name}</p>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {selectedAisp.cities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Nenhum município encontrado.</div>
              ) : (
                selectedAisp.cities.map(city => (
                  <button
                    key={city.name}
                    onClick={() => handleCitySelect(city)}
                    className={clsx(
                      "w-full text-left px-4 py-4 rounded-lg flex items-center justify-between transition-all group mb-1 border-l-4",
                      selectedCity?.name === city.name
                        ? "bg-blue-50 border-blue-600 text-blue-900"
                        : "bg-transparent border-transparent hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div>
                      <span className="font-medium block">{city.name}</span>
                      {selectedCity?.name === city.name && <span className="text-xs text-blue-500 mt-0.5 block">{selectedAisp.name}</span>}
                    </div>
                    <span className={clsx(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      selectedCity?.name === city.name ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"
                    )}>
                      {city.buildings.length} un.
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Column 3: Buildings */}
        {selectedCity && (
          <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Building2 size={18} className="text-slate-400" />
                Prédios
                <span className="ml-auto bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full">{selectedCity.buildings.length}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 truncate">Em: {selectedCity.name}</p>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {selectedCity.buildings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Nenhum prédio encontrado.</div>
              ) : (
                selectedCity.buildings.map(building => (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingSelect(building)}
                    className={clsx(
                      "w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all group mb-1 border-l-4",
                      selectedBuilding?.id === building.id
                        ? "bg-blue-50 border-blue-600 text-blue-900"
                        : "bg-transparent border-transparent hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{building.name}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-medium", selectedBuilding?.id === building.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
                          {building.units.length} un.
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Column 3: Units */}
        {selectedBuilding && (
          <div className="w-96 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <IdCard size={18} className="text-slate-400" />
                Unidades
                <span className="ml-auto bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full">{selectedBuilding.units.length}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 truncate">Em: {selectedBuilding.name}</p>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {selectedBuilding.units.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Nenhuma unidade vinculada.</div>
              ) : (
                selectedBuilding.units.map(unit => (
                  <div
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    className={clsx(
                      "p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                      "bg-white hover:border-blue-400 border-slate-200 group relative overflow-hidden",
                      "hover:bg-white"
                    )}
                  >
                    <h3 className="font-bold text-slate-800 mb-1 leading-tight">{unit.name}</h3>

                    {/* Hierarchy Info */}
                    {unit.hierarchy && unit.hierarchy !== '---' && (
                      <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        {unit.hierarchy}
                      </div>
                    )}

                    {/* Fleet Badge */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                      {unit.fleet.length > 0 ? (
                        <div className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium flex items-center gap-1.5">
                          <Car size={14} />
                          {unit.fleet.length} Veículos
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded bg-slate-50 text-slate-400 border border-slate-100 text-xs font-medium flex items-center gap-1.5">
                          <Car size={14} />
                          Sem frota
                        </div>
                      )}

                      {unit.people.length > 0 ? (
                        <div className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium flex items-center gap-1.5">
                          <Users size={14} />
                          {unit.people.length} Pessoas
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded bg-slate-50 text-slate-400 border border-slate-100 text-xs font-medium flex items-center gap-1.5">
                          <Users size={14} />
                          Sem pessoas
                        </div>
                      )}

                      <div className="ml-auto text-slate-300 group-hover:text-blue-500 transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      <UnitDetailsDrawer
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        unit={selectedUnit || undefined}
      />
    </div >
  );
}

export default App;
