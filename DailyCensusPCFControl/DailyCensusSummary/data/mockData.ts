import { IPersonaProps, PersonaPresence } from "@fluentui/react/lib/Persona";
import { IBasePickerSuggestionsProps } from "@fluentui/react/lib/Pickers";
import { IJuvenileRecord } from "../components/types";

export const suggestionProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: "Suggested Residents",
    mostRecentlyUsedHeaderText: "Recent Records",
    noResultsFoundText: "No matching juvenile records found",
    loadingText: "Loading...",
    showRemoveButtons: true,
};

export const MOCK_FACILITY_RECORDS: IJuvenileRecord[] = [
    { id: "rec01", juvenileName: "Rakesh", facility: "Central jail", building: "Tower 5", purpose: "Court" },
    { id: "rec02", juvenileName: "Isaiah Cooper", facility: "Central jail", building: "Tower 1", purpose: "AWOL" },
    { id: "rec03", juvenileName: "Jayden Morris", facility: "Central jail", building: "Tower 2", purpose: "Court" },
    { id: "rec04", juvenileName: "Nathan Kelly", facility: "Central jail", building: "Tower 3", purpose: "Discharged" },
    { id: "rec05", juvenileName: "Aiden Clark", facility: "Central jail", building: "Tower 5", purpose: "Home Pass" },
    { id: "rec06", juvenileName: "Bryson Hill", facility: "Central jail", building: "Tower 1", purpose: "Home Pass" },
    { id: "rec07", juvenileName: "Cameron Scott", facility: "Central jail", building: "Tower 4", purpose: "Hospital" },
    { id: "rec08", juvenileName: "Devin Carter", facility: "Central jail", building: "Tower 2", purpose: "Intake" },
    { id: "rec09", juvenileName: "Marcus Lee", facility: "Central jail", building: "Tower 3", purpose: "Non-Billable" },
    { id: "rec10", juvenileName: "Tyler Bennett", facility: "Central jail", building: "Tower 5", purpose: "Other" }
];

export function transformRecordToPersona(record: IJuvenileRecord): IPersonaProps {
    return {
        key: record.id,
        text: record.juvenileName,
        secondaryText: `${record.facility} - ${record.building}`,
        presence: PersonaPresence.none
    };
}

export const MASTER_PEOPLE_LIST: IPersonaProps[] = MOCK_FACILITY_RECORDS.map(transformRecordToPersona);

export const INITIAL_CENSUS_ROWS = [
    { status: "Other", popLabel: "Other", residents: [] },
    { status: "AWOL", popLabel: "AWOL", residents: [MASTER_PEOPLE_LIST[1]] },
    { status: "Home Pass", popLabel: "Home Visit", residents: [MASTER_PEOPLE_LIST[4], MASTER_PEOPLE_LIST[5]] },
    { status: "Court", popLabel: "Court", residents: [MASTER_PEOPLE_LIST[0], MASTER_PEOPLE_LIST[2]] },
    { status: "Intake", popLabel: "Intake", residents: [MASTER_PEOPLE_LIST[7]] },
    { status: "Discharged", popLabel: "Discharged", residents: [MASTER_PEOPLE_LIST[3]] },
    { status: "Non-Billable", popLabel: "Non Billable Status", residents: [MASTER_PEOPLE_LIST[8]] },
    { status: "Hospital", popLabel: "Hospital", residents: [MASTER_PEOPLE_LIST[6]] }
];
