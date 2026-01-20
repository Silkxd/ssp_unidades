import * as XLSX from 'xlsx';
import type { Aisp, Unit, RawUnit, RawAispResponsable, RawBuilding, RawFleet, RawPessoa, Person } from '../types';

const FILE_PATH = '/base de dados/Dados gerais.xlsx';
const PESSOAS_FILE_PATH = '/base de dados/PESSOAS.xlsx';

export const fetchAndParseData = async (): Promise<Aisp[]> => {
    try {
        // Add cache-busting timestamp to force reload of updated Excel file
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(FILE_PATH + cacheBuster);
        if (!response.ok) {
            // Fallback for different name if needed?
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Helper to get sheet data with normalized column names
        const getSheet = <T>(name: string): T[] => {
            const sheet = workbook.Sheets[name];
            if (!sheet) return [];
            const data = XLSX.utils.sheet_to_json<any>(sheet);

            // Normalize all column names to lowercase and trim spaces
            return data.map(row => {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.trim().toLowerCase();
                    newRow[normalizedKey] = row[key];
                });
                return newRow;
            }) as T[];
        };

        const unidades = getSheet<RawUnit>('UNIDADES');
        const frota = getSheet<RawFleet>('FROTA');
        const prediosData = getSheet<RawBuilding>('PRÉDIOS');
        const responsaveisData = getSheet<RawAispResponsable>('RESPONSÁVEIS POR AISP');

        // Load PESSOAS from separate file
        const pessoasResponse = await fetch(PESSOAS_FILE_PATH + cacheBuster);
        if (!pessoasResponse.ok) {
            throw new Error(`Failed to fetch PESSOAS file: ${pessoasResponse.statusText}`);
        }
        const pessoasArrayBuffer = await pessoasResponse.arrayBuffer();
        const pessoasWorkbook = XLSX.read(pessoasArrayBuffer, { type: 'array' });

        // Directly process the PESSOAS workbook with normalization
        const pessoasSheet = pessoasWorkbook.Sheets['PESSOAS'];
        const pessoasData = XLSX.utils.sheet_to_json<any>(pessoasSheet);
        const pessoasNormalized = pessoasData.map(row => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                const normalizedKey = key.trim().toLowerCase();
                newRow[normalizedKey] = row[key];
            });
            return newRow;
        }) as RawPessoa[];

        // Normalizers
        const norm = (val: any) => String(val || '').trim();

        // Normalize IDs: convert to number and back to string to remove leading zeros
        const normId = (val: any) => {
            if (val === undefined || val === null) return '';
            const num = Number(val);
            return isNaN(num) ? String(val).trim() : String(num);
        };


        // 1. Index Fleet by id_unidade
        const fleetByUnitId = new Map<string, any[]>();

        // DEBUG: Check keys
        if (frota.length > 0) console.log('FROTA keys:', Object.keys(frota[0]));
        if (unidades.length > 0) console.log('UNIDADES keys:', Object.keys(unidades[0]));
        if (pessoasNormalized.length > 0) console.log('PESSOAS keys:', Object.keys(pessoasNormalized[0]));

        frota.forEach(row => {
            // Use normalized lowercase keys
            const rawId = row['id_unidade'] || row['lotacao'];
            if (!rawId) return;
            const key = normId(rawId);
            if (!fleetByUnitId.has(key)) fleetByUnitId.set(key, []);
            fleetByUnitId.get(key)!.push(row);
        });

        // 2. Index People by id_unidade
        const peopleByUnitId = new Map<string, any[]>();

        // Log all column names from first PESSOAS row to debug
        if (pessoasNormalized.length > 0) {
            console.log('ALL PESSOAS columns (normalized):', Object.keys(pessoasNormalized[0]));
            console.log('First PESSOAS row sample:', pessoasNormalized[0]);
        }

        pessoasNormalized.forEach((row, idx) => {
            // Use normalized lowercase key
            const rawId = row['id_unidade'];
            if (!rawId) {
                if (idx < 3) console.log(`PESSOAS row ${idx} missing id_unidade, has keys:`, Object.keys(row));
                return;
            }
            const key = normId(rawId);
            if (!peopleByUnitId.has(key)) peopleByUnitId.set(key, []);
            peopleByUnitId.get(key)!.push(row);
        });

        console.log('Total PESSOAS indexed:', peopleByUnitId.size);
        console.log('Sample PESSOAS unit IDs:', Array.from(peopleByUnitId.keys()).slice(0, 10));

        // 3. Index Buildings by PREDIO name
        const buildingInfoByName = new Map<string, RawBuilding>();
        prediosData.forEach(row => {
            const key = norm(row['predio']);
            if (key) buildingInfoByName.set(key, row);
        });

        // 4. Index Commanders by AISP
        const commandersByAisp = new Map<string, RawAispResponsable>();
        responsaveisData.forEach(row => {
            const key = norm(row['aisp']);
            if (key) commandersByAisp.set(key, row);
        });

        // Data Structure Construction
        const aispMap = new Map<string, Aisp>();
        const sampleUnitIds: string[] = [];

        unidades.forEach(u => {
            // Extract Keys - use normalized lowercase column names
            const unitId = normId(u['id_unidade'] || u['id'] || '');
            const predioName = norm(u['predio'] || 'Sem Prédio');
            const aispName = norm(u['aisp'] || 'Sem AISP');
            const unitName = norm(u['nome'] || u['unidade'] || `Unidade ${unitId}`);

            // Hierarchy: Check 'HIERARQUIA', 'SUBORDINACAO', or look for specific column
            // Assuming 'HIERARQUIA' based on user request "HIERARQUIA IMEDIATA" likely being the column name
            const hierarchy = String(u['hierarquia'] || u['hierarquia imediata'] || u['dominio'] || '---');

            if (sampleUnitIds.length < 10 && unitId) sampleUnitIds.push(unitId);

            if (!unitId) return;

            // A. Get or Create AISP
            if (!aispMap.has(aispName)) {
                const cmdData = commandersByAisp.get(aispName);
                aispMap.set(aispName, {
                    id: aispName,
                    name: `AISP ${aispName}`,
                    commanderPM: cmdData ? String(cmdData['responsavel_pm'] || cmdData['pm'] || '') : '',
                    delegatePC: cmdData ? String(cmdData['responsavel_pc'] || cmdData['pc'] || '') : '',
                    cities: []
                });
            }
            const aisp = aispMap.get(aispName)!;

            const bData = buildingInfoByName.get(predioName);
            // Prioritize CITY from UNIDADES row
            const cityName = String(u['cidade'] || (bData ? bData['cidade'] : '') || 'Desconhecida');

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

            const myFleet = myFleetRaw.map((v, i) => ({
                id: norm(v['id'] || v['placa'] || `fleet-${unitId}-${i}`),
                model: String(v['modelo'] || 'Veículo'),
                plate: String(v['placa'] || '---'),
                type: String(v['tipo'] || 'Viatura'),
                unitId: unitId
            }));

            // E. Attach People
            const myPeopleRaw = peopleByUnitId.get(unitId) || [];
            const myPeople: Person[] = myPeopleRaw.map((p, i) => ({
                id: norm(p['id'] || p['cpf'] || `person-${unitId}-${i}`),
                name: String(p['nome'] || 'Pessoa'),
                role: String(p['cargo'] || p['funcao'] || p['função'] || '---'),
                unitId: unitId
            }));

            // Debug specific for when a unit doesn't find people
            if (myPeopleRaw.length === 0 && pessoasNormalized.length > 0 && unitName.includes('18º Batalhão')) {
                console.warn(`⚠️ Unidade ${unitName} (ID: ${unitId}) não encontrou pessoas.`);
                console.warn(`IDs disponíveis no Map (primeiros 10):`, Array.from(peopleByUnitId.keys()).slice(0, 10));
                console.warn(`Tentou buscar com ID:`, unitId);
            }

            // General debug logging
            if (unitName.includes('18º Batalhão') || myPeople.length > 0) {
                console.log(`✓ Unit: ${unitName} (ID: ${unitId}) - Found ${myPeople.length} people`);
            }

            const newUnit: Unit = {
                id: unitId,
                originalId: norm(u['id']),
                name: unitName,
                hierarchy: hierarchy,
                aisp: aispName,
                buildingId: predioName,
                fleet: myFleet,
                people: myPeople
            };

            building.units.push(newUnit);
        });

        console.log('Sample UNIDADES IDs:', sampleUnitIds);

        const sortedAisps = Array.from(aispMap.values());

        // Sort Cities within each AISP alphabetically
        sortedAisps.forEach(aisp => {
            aisp.cities.sort((a, b) => a.name.localeCompare(b.name));
        });

        return sortedAisps;

    } catch (error) {
        console.error("Error parsing Excel:", error);
        return [];
    }
};
