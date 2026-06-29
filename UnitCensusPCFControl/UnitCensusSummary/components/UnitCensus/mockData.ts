import { IPersonaProps, PersonaPresence } from "@fluentui/react/lib/Persona";
import { IUnitRecord } from "./types";

export const MOCK_UNIT_RECORDS: IUnitRecord[] = [
    { id: "u01", juvenileName: "Mason Reed" },
    { id: "u02", juvenileName: "Elijah Brooks" },
    { id: "u03", juvenileName: "Noah Turner" },
    { id: "u04", juvenileName: "Jordan Hayes" },
    { id: "u05", juvenileName: "Liam Foster" },
    { id: "u06", juvenileName: "Isaiah Cooper" },
    { id: "u07", juvenileName: "Jayden Morris" },
    { id: "u08", juvenileName: "Aiden Clark" },
    { id: "u09", juvenileName: "Bryson Hill" },
    { id: "u10", juvenileName: "Nathan Kelly" },
    { id: "u11", juvenileName: "Cameron Scott" },
    { id: "u12", juvenileName: "Devin Carter" },
    { id: "u13", juvenileName: "Marcus Lee" },
    { id: "u14", juvenileName: "Tyler Bennett" }
];

export function transformToPersona(record: IUnitRecord): IPersonaProps {
    return {
        key: record.id,
        text: record.juvenileName,
        presence: PersonaPresence.none
    };
}

export const MASTER_PEOPLE_LIST: IPersonaProps[] = MOCK_UNIT_RECORDS.map(transformToPersona);