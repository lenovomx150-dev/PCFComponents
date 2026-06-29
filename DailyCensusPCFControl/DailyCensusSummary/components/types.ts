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
