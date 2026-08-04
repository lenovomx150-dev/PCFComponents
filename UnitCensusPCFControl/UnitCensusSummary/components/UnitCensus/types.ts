import { IPersonaProps } from "@fluentui/react/lib/Persona";

export interface IUnitCensusResident {
    id: string;
    juvenileId?: string;
    juvenile: string;
    purpose: string;
    temporaryAbsenceStartDate?: string;
    temporaryAbsenceEndDate?: string;
}

export interface ICensusRow {
    status: string;
    popLabel: string;
    residents: IPersonaProps[];
}
