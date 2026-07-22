// import { IPersonaProps, PersonaPresence } from "@fluentui/react/lib/Persona";
// import { IBasePickerSuggestionsProps } from "@fluentui/react/lib/Pickers";
// import { IJuvenileRecord } from "../components/types";

// /**
//  * Temporary display data. Replace this source with the Dynamics Web API result
//  * once the Resident Census query is available.
//  */
// export const SAMPLE_RESIDENT_CENSUS_ROWS = [
//     {
//         id: "a1111111-1111-1111-1111-111111111111",
//         juvenile: "Avery Williams",
//         facilityRecord: "a1111111-1111-1111-1111-111111111111",
//         unitCensus: "Unit A - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: ""
//     },
//     {
//         id: "a2222222-2222-2222-2222-222222222222",
//         juvenile: "Isaiah Cooper",
//         facilityRecord: "a2222222-2222-2222-2222-222222222222",
//         unitCensus: "Unit A - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: "AWOL"
//     },
//     {
//         id: "a3333333-3333-3333-3333-333333333333",
//         juvenile: "Aiden Clark",
//         facilityRecord: "a3333333-3333-3333-3333-333333333333",
//         unitCensus: "Unit B - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: "Home Pass"
//     },
//     {
//         id: "a4444444-4444-4444-4444-444444444444",
//         juvenile: "Bryson Hill",
//         facilityRecord: "a4444444-4444-4444-4444-444444444444",
//         unitCensus: "Unit B - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: "Home Pass"
//     },
//     {
//         id: "a5555555-5555-5555-5555-555555555555",
//         juvenile: "Rakesh Patel",
//         facilityRecord: "a5555555-5555-5555-5555-555555555555",
//         unitCensus: "Unit C - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: "Court"
//     },
//     {
//         id: "a6666666-6666-6666-6666-666666666666",
//         juvenile: "Jayden Morris",
//         facilityRecord: "a6666666-6666-6666-6666-666666666666",
//         unitCensus: "Unit C - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: "Court"
//     },
//     {
//         id: "a7777777-7777-7777-7777-777777777777",
//         juvenile: "Cameron Scott",
//         facilityRecord: "a7777777-7777-7777-7777-777777777777",
//         unitCensus: "Unit D - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: "Hospital"
//     },
//     {
//         id: "a8888888-8888-8888-8888-888888888888",
//         juvenile: "Tyler Bennett",
//         facilityRecord: "a8888888-8888-8888-8888-888888888888",
//         unitCensus: "Unit D - 07/16/2026",
//         dailyCensus: "Main Facility - 07/16/2026",
//         facility: "Main Facility",
//         purpose: "Other"
//     }
// ];

// export const suggestionProps: IBasePickerSuggestionsProps = {
//     suggestionsHeaderText: "Suggested Residents",
//     mostRecentlyUsedHeaderText: "Recent Records",
//     noResultsFoundText: "No matching juvenile records found",
//     loadingText: "Loading...",
//     showRemoveButtons: true,
// };

// export const MOCK_FACILITY_RECORDS: IJuvenileRecord[] = [
//     { id: "rec01", juvenileName: "Rakesh", facility: "Central jail", building: "Tower 5", purpose: "Court" },
//     { id: "rec02", juvenileName: "Isaiah Cooper", facility: "Central jail", building: "Tower 1", purpose: "AWOL" },
//     { id: "rec03", juvenileName: "Jayden Morris", facility: "Central jail", building: "Tower 2", purpose: "Court" },
//     { id: "rec04", juvenileName: "Nathan Kelly", facility: "Central jail", building: "Tower 3", purpose: "Discharged" },
//     { id: "rec05", juvenileName: "Aiden Clark", facility: "Central jail", building: "Tower 5", purpose: "Home Pass" },
//     { id: "rec06", juvenileName: "Bryson Hill", facility: "Central jail", building: "Tower 1", purpose: "Home Pass" },
//     { id: "rec07", juvenileName: "Cameron Scott", facility: "Central jail", building: "Tower 4", purpose: "Hospital" },
//     { id: "rec08", juvenileName: "Devin Carter", facility: "Central jail", building: "Tower 2", purpose: "Intake" },
//     { id: "rec09", juvenileName: "Marcus Lee", facility: "Central jail", building: "Tower 3", purpose: "Non-Billable" },
//     { id: "rec10", juvenileName: "Tyler Bennett", facility: "Central jail", building: "Tower 5", purpose: "Other" }
// ];

// export function transformRecordToPersona(record: IJuvenileRecord): IPersonaProps {
//     return {
//         key: record.id,
//         text: record.juvenileName,
//         secondaryText: `${record.facility} - ${record.building}`,
//         presence: PersonaPresence.none
//     };
// }

// export const MASTER_PEOPLE_LIST: IPersonaProps[] = MOCK_FACILITY_RECORDS.map(transformRecordToPersona);

// export const INITIAL_CENSUS_ROWS = [
//     { status: "Other", popLabel: "Other", residents: [] },
//     { status: "AWOL", popLabel: "AWOL", residents: [MASTER_PEOPLE_LIST[1]] },
//     { status: "Home Pass", popLabel: "Home Visit", residents: [MASTER_PEOPLE_LIST[4], MASTER_PEOPLE_LIST[5]] },
//     { status: "Court", popLabel: "Court", residents: [MASTER_PEOPLE_LIST[0], MASTER_PEOPLE_LIST[2]] },
//     { status: "Intake", popLabel: "Intake", residents: [MASTER_PEOPLE_LIST[7]] },
//     { status: "Discharged", popLabel: "Discharged", residents: [MASTER_PEOPLE_LIST[3]] },
//     { status: "Non-Billable", popLabel: "Non Billable Status", residents: [MASTER_PEOPLE_LIST[8]] },
//     { status: "Hospital", popLabel: "Hospital", residents: [MASTER_PEOPLE_LIST[6]] }
// ];
