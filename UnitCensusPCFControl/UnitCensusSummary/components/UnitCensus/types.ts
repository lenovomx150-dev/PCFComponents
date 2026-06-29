import { IPersonaProps } from "@fluentui/react/lib/Persona";

export interface IUnitRecord {
    id: string;
    juvenileName: string;
}

export interface ICensusRow {
    status: string;
    popLabel: string;
    residents: IPersonaProps[];
}