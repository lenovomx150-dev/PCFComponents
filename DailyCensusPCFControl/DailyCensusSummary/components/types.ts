import { IPersonaProps } from "@fluentui/react/lib/Persona";

export interface IJuvenileRecord {
    id: string;
    juvenileName: string;
    facility: string;
    building: string;
    purpose: string;
}

export interface ICensusStatusRow {
    status: string;
    popLabel: string;
    residents: IPersonaProps[];
}

export interface IResidentCensusRow {
    id: string;
    juvenile: string;
    facilityRecord: string;
    unitCensus: string;
    purpose: string;
    dailyCensus: string;
    facility: string;
    recordId?: string;
    juvenileId?: string;
    date?: string;  // ucm_date field (ISO format: 2026-07-21T00:00:00Z)
}

export interface IAvailableJuvenile {
    ucm_offenderid: string;
    ucm_fullname: string;
    ucm_juvenileid: string;
}
