import * as XLSX from 'xlsx';
import type { Aisp, City, Unit, RawUnit, RawAispResponsable, RawBuilding, RawFleet } from '../types';

const FILE_PATH = '/base de dados/Dados gerais.xlsx';

export const fetchAndParseData = async (): Promise<Aisp[]> => {
    try {
        const response = await fetch(FILE_PATH);
        if (!response.ok) {
            // Fallback for different name if needed?
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Helper to get sheet data
        const getSheet = <T>(name: string): T[] => {
            const sheet = workbook.Sheets[name];
            if (!sheet) return [];
            return XLSX.utils.sheet_to_json<T>(sheet);
        };

        const unidades = getSheet<RawUnit>('UNIDADES');
        const frota = getSheet<RawFleet>('FROTA');
        const prediosData = getSheet<RawBuilding>('PRÉDIOS');
        const responsaveisData = getSheet<RawAispResponsable>('RESPONSÁVEIS POR AISP');

        // Normalizers
        const norm = (val: any) => String(val || '').trim();


        // 1. Index Fleet by id_unidade
        const fleetByUnitId = new Map<string, any[]>();

        // DEBUG: Check keys
        if (frota.length > 0) console.log('FROTA keys:', Object.keys(frota[0]));
        if (unidades.length > 0) console.log('UNIDADES keys:', Object.keys(unidades[0]));

        frota.forEach(row => {
            // Try explicit 'id_unidade' or uppercase 'ID_UNIDADE' or 'id_unidade_tth_...'
            // Sometimes Excel json parsers add extra chars or mismatched case
            const rawId = row['id_unidade'] || row['ID_UNIDADE'] || row['Id_unidade'];
            if (!rawId) return;
            const key = norm(rawId);
            if (!fleetByUnitId.has(key)) fleetByUnitId.set(key, []);
            fleetByUnitId.get(key)!.push(row);
        });

        // 2. Index Buildings by PREDIO name
        const buildingInfoByName = new Map<string, RawBuilding>();
        prediosData.forEach(row => {
            const key = norm(row['PREDIO']);
            if (key) buildingInfoByName.set(key, row);
        });

        // 3. Index Commanders by AISP
        const commandersByAisp = new Map<string, RawAispResponsable>();
        responsaveisData.forEach(row => {
            const key = norm(row['AISP']);
            if (key) commandersByAisp.set(key, row);
        });

        // Data Structure Construction
        const aispMap = new Map<string, Aisp>();

        unidades.forEach(u => {
            // Extract Keys
            const unitId = norm(u['id_unidade'] || u['ID_UNIDADE'] || u['ID'] || '');
            const predioName = norm(u['PREDIO'] || 'Sem Prédio');
            const aispName = norm(u['AISP'] || 'Sem AISP');
            const unitName = norm(u['NOME'] || u['UNIDADE'] || `Unidade ${unitId}`);

            // Hierarchy: Check 'HIERARQUIA', 'SUBORDINACAO', or look for specific column
            // Assuming 'HIERARQUIA' based on user request "HIERARQUIA IMEDIATA" likely being the column name
            const hierarchy = String(u['HIERARQUIA'] || u['HIERARQUIA IMEDIATA'] || u['DOMINIO'] || '---');

            if (!unitId) return;

            // A. Get or Create AISP
            if (!aispMap.has(aispName)) {
                const cmdData = commandersByAisp.get(aispName);
                aispMap.set(aispName, {
                    id: aispName,
                    name: `AISP ${aispName}`,
                    commanderPM: cmdData ? String(cmdData.RESPONSAVEL_PM || cmdData.PM || '') : '',
                    delegatePC: cmdData ? String(cmdData.RESPONSAVEL_PC || cmdData.PC || '') : '',
                    cities: []
                });
            }
            const aisp = aispMap.get(aispName)!;

            const bData = buildingInfoByName.get(predioName);
            // Prioritize CITY from UNIDADES row (u['CIDADE'] is likely row.CIDADE)
            const cityName = String(u['CIDADE'] || (bData ? bData.CIDADE : '') || 'Desconhecida');

            // B. Get or Create City WITHIN this AISP
            let city = aisp.cities.find(c => c.name === cityName);
            if (!city) {
                city = {
                    name: cityName,
                    buildings: []
                };
                aisp.cities.push(city);
            }

            // C. Get or Create Building WITHIN this City
            let building = city.buildings.find(b => b.name === predioName);
            if (!building) {
                building = {
                    id: predioName,
                    name: predioName,
                    city: cityName,
                    units: []
                };
                city.buildings.push(building);
            }

            // D. Create Unit & Attach Fleet
            const myFleetRaw = fleetByUnitId.get(unitId) || [];
            if (myFleetRaw.length === 0) {
                // Deep debug for specific failures if needed, but for now rely on general keys log
            }

            const myFleet = myFleetRaw.map((v, i) => ({
                id: norm(v['ID'] || v['PLACA'] || `fleet-${unitId}-${i}`),
                model: String(v['MODELO'] || v['Modelo'] || v['modelo'] || 'Veículo'),
                plate: String(v['PLACA'] || v['Placa'] || v['placa'] || '---'),
                type: String(v['TIPO'] || v['Tipo'] || v['tipo'] || 'Viatura'),
                unitId: unitId
            }));

            const newUnit: Unit = {
                id: unitId,
                originalId: norm(u['ID']),
                name: unitName,
                hierarchy: hierarchy,
                aisp: aispName,
                buildingId: predioName,
                fleet: myFleet
            };

            building.units.push(newUnit);
        });

        const sortedAisps = Array.from(aispMap.values());
        return sortedAisps;

    } catch (error) {
        console.error("Error parsing Excel:", error);
        return [];
    }
};
