export interface Aisp {
    id: string; // From AISP column
    name: string;
    commanderPM?: string;
    delegatePC?: string;
    cities: City[];
}

export interface City {
    name: string;
    buildings: Building[];
}

export interface Building {
    id: string; // From PREDIO column in UNIDADES or PRÉDIOS sheet?
    name: string;
    city: string; // Keep for reference if needed
    units: Unit[];
}

export interface Unit {
    id: string; // id_unidade
    originalId: string; // ID from UNIDADES
    name: string; // Usually Unit name in UNIDADES
    hierarchy: string; // HIERARQUIA IMEDIATA
    aisp: string;
    buildingId: string;
    fleet: Vehicle[];
    people: Person[];
}

export interface Vehicle {
    id: string;
    model: string;
    plate: string;
    type: string;
    unitId: string;
}

export interface Person {
    id: string;
    name: string;
    role: string;
    unitId: string;
}

// Raw Excel Row interfaces
export interface RawUnit {
    ID: string;
    PREDIO: string;
    AISP: string;
    id_unidade: string;
    [key: string]: any; // Other fields
}

export interface RawFleet {
    id_unidade: string;
    [key: string]: any;
}

export interface RawPessoa {
    id_unidade: string;
    ID_UNIDADE: string;
    [key: string]: any;
}

export interface RawBuilding {
    PREDIO: string;
    CIDADE?: string;
    NOME?: string;
    [key: string]: any;
}

export interface RawAispResponsable {
    AISP: string;
    RESPONSAVEL_PM?: string;
    RESPONSAVEL_PC?: string;
    [key: string]: any;
}
