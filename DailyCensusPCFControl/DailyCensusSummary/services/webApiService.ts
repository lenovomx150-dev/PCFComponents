import { IResidentCensusRow } from "../components/types";

export interface IWebApiConfig {
    orgUrl: string;
    webApiVersion: string;
}

/**
 * Service for interacting with Dynamics Web API
 */
export class WebApiService {
    private webApiVersion = "v9.0";
    private readonly purposeValues: Record<string, number> = {
        "Other": 1,
        "AWOL": 2,
        "Home Pass": 3,
        "Court": 4,
        "Intake": 5,
        "Discharged": 6,
        "Non-Billable": 7,
        "Hospital": 8
    };

    constructor(private context: ComponentFramework.Context<any>) {}

    private async tryRetrieveMultipleRecords(entityNames: string[], query: string): Promise<any> {
        let lastError: unknown;

        for (const entityName of entityNames) {
            try {
                return await this.context.webAPI.retrieveMultipleRecords(entityName, query);
            } catch (error) {
                lastError = error;
                console.warn(`Failed to query ${entityName}:`, error);
            }
        }

        if (lastError instanceof Error) {
            throw lastError;
        }

        throw new Error("Unable to query Dataverse entity");
    }

    private formatDateForOData(value: string | undefined): string {
        if (!value) {
            return "";
        }

        const trimmedValue = value.trim();
        const dateOnlyValue = trimmedValue.includes("T")
            ? trimmedValue.split("T")[0]
            : trimmedValue;
        // Dataverse Web API uses OData v4. The OData v2 datetime'…' syntax is
        // rejected as a string literal; use an unquoted ISO 8601 timestamp.
        return `${dateOnlyValue}T00:00:00Z`;
    }

    private getPurposeValue(purpose: string): number {
        const value = this.purposeValues[purpose];
        if (value === undefined) {
            throw new Error(`Unknown Unit Census Resident purpose: ${purpose}`);
        }
        return value;
    }

    /** Fetch the Daily Census record currently hosting the control. */
    async getDailyCensus(dailyCensusId: string): Promise<any> {
        try {
            return await this.context.webAPI.retrieveRecord(
                "ucm_dailycensus",
                dailyCensusId,
                "?$select=createdon,_ucm_facility_value"
            );
        } catch (error) {
            console.error("Error fetching Daily Census:", error);
            throw error;
        }
    }

    /**
     * Fetch all Unit Census Residents for a daily census by date and facility
     * Uses ucm_date field to match the daily census date
     */
    async getUnitCensusResidents(dailyCensusId: string, dailyCensusDate: string, facilityId: string): Promise<IResidentCensusRow[]> {
        try {
            const formattedDate = this.formatDateForOData(dailyCensusDate);
            const query = `?$select=ucm_unitcensusresidentid,ucm_purpose,ucm_date,_ucm_juvenile_value,_ucm_facilityrecord_value,_ucm_unitcensus_value,_ucm_dailycensus_value,_ucm_facility_value&$filter=statecode eq 0 and _ucm_dailycensus_value eq '${dailyCensusId}' and ucm_date eq ${formattedDate} and _ucm_facility_value eq '${facilityId}'`;
            const response = await this.context.webAPI.retrieveMultipleRecords(
                "ucm_unitcensusresident",
                query
            );

            return response.entities.map((entity: any) => ({
                id: entity.ucm_unitcensusresidentid,
                juvenile: entity["_ucm_juvenile_value@OData.Community.Display.V1.FormattedValue"] || "",
                facilityRecord: entity["_ucm_facilityrecord_value@OData.Community.Display.V1.FormattedValue"] || "",
                unitCensus: entity["_ucm_unitcensus_value@OData.Community.Display.V1.FormattedValue"] || "",
                purpose: entity["ucm_purpose@OData.Community.Display.V1.FormattedValue"] || entity.ucm_purpose || "",
                dailyCensus: entity._ucm_dailycensus_value || "",
                facility: entity["_ucm_facility_value@OData.Community.Display.V1.FormattedValue"] || "",
                recordId: entity.ucm_unitcensusresidentid,
                juvenileId: entity._ucm_juvenile_value,
                date: entity.ucm_date
            }));
        } catch (error) {
            console.error("Error fetching Unit Census Residents:", error);
            throw error;
        }
    }

    /**
     * Fetch juveniles through active Facility Records for the supplied program.
     * The juvenile itself does not carry a facility/program lookup; that
     * relationship is stored on Facility Record (ucm_program + ucm_juvenile).
     */
    async getAllActiveJuveniles(facilityId: string): Promise<any[]> {
        try {
            const facilityRecordsQuery = `?$select=ucm_facilityrecordid,_ucm_juvenile_value&$filter=_ucm_program_value eq '${facilityId}' and statecode eq 0&$expand=ucm_Juvenile($select=ucm_offenderid,ucm_fullname,ucm_juvenileid)`;
            const facilityRecordsResponse = await this.context.webAPI.retrieveMultipleRecords(
                "ucm_facilityrecord",
                facilityRecordsQuery
            );

            return facilityRecordsResponse.entities
                .map((facilityRecord: any) => {
                    const juvenile = facilityRecord.ucm_Juvenile;
                    if (!juvenile?.ucm_offenderid) return null;

                    return {
                        ucm_offenderid: juvenile.ucm_offenderid,
                        ucm_fullname: juvenile.ucm_fullname,
                        ucm_juvenileid: juvenile.ucm_juvenileid,
                        ucm_facilityrecordid: facilityRecord.ucm_facilityrecordid
                    };
                })
                .filter(Boolean);
        } catch (error) {
            console.error("Error fetching juveniles from Facility Records:", error);
            throw error;
        }
    }

    /**
     * Fetch available juveniles for a facility and date (not assigned to any purpose in this daily census)
     * Filters by both facility and ucm_date to match the daily census
     */
    async getAvailableJuveniles(facilityId: string, censusDate: string, dailyCensusId?: string): Promise<any[]> {
        try {
            const juveniles = await this.getAllActiveJuveniles(facilityId);

            // Get all residents already assigned to this date and facility (regardless of purpose)
            // Filter by both date (ucm_date) and facility to be specific to this daily census
            const formattedDate = this.formatDateForOData(censusDate);
            const dailyCensusFilter = dailyCensusId ? ` and _ucm_dailycensus_value eq '${dailyCensusId}'` : "";
            const residentsQuery = `?$filter=statecode eq 0 and ucm_date eq ${formattedDate} and _ucm_facility_value eq '${facilityId}'${dailyCensusFilter}&$select=_ucm_juvenile_value`;
            const residentsResponse = await this.context.webAPI.retrieveMultipleRecords(
                "ucm_unitcensusresident",
                residentsQuery
            );

            const assignedJuvenileIds = new Set(
                residentsResponse.entities.map((r: any) => r._ucm_juvenile_value)
            );

            // Filter out juveniles that are already assigned
            return juveniles.filter(
                (juvenile: any) => !assignedJuvenileIds.has(juvenile.ucm_offenderid)
            );
        } catch (error) {
            console.error("Error fetching available juveniles:", error);
            throw error;
        }
    }

    /**
     * Create a new Unit Census Resident record with date field
     */
    async createUnitCensusResident(
        juvenileId: string,
        dailyCensusId: string,
        facilityId: string,
        purpose: string,
        censusDate: string,
        unitCensusId?: string,
        facilityRecordId?: string
    ): Promise<any> {
        try {
            const entity = {
                // The lookup attribute names are lower-case, but Dataverse expects
                // the schema-cased navigation-property names for @odata.bind.
                "ucm_Juvenile@odata.bind": `/ucm_offenders(${juvenileId})`,
                "ucm_DailyCensus@odata.bind": `/ucm_dailycensuses(${dailyCensusId})`,
                "ucm_Facility@odata.bind": `/ucm_admissionprograms(${facilityId})`,
                ucm_purpose: this.getPurposeValue(purpose),
                ucm_date: censusDate.includes("T") ? censusDate : `${censusDate}T00:00:00Z`
            };

            if (unitCensusId) {
                (entity as any)["ucm_UnitCensus@odata.bind"] = `/ucm_unitcensuses(${unitCensusId})`;
            }

            if (facilityRecordId) {
                (entity as any)["ucm_FacilityRecord@odata.bind"] = `/ucm_facilityrecords(${facilityRecordId})`;
            }

            const response = await this.context.webAPI.createRecord("ucm_unitcensusresident", entity);
            return response;
        } catch (error) {
            console.error("Error creating Unit Census Resident:", error);
            throw error;
        }
    }

    /**
     * Update a Unit Census Resident record
     */
    async updateUnitCensusResident(
        recordId: string,
        purpose: string
    ): Promise<void> {
        try {
            const entity = {
                ucm_purpose: this.getPurposeValue(purpose)
            };

            await this.context.webAPI.updateRecord("ucm_unitcensusresident", recordId, entity);
        } catch (error) {
            console.error("Error updating Unit Census Resident:", error);
            throw error;
        }
    }

    /**
     * Deactivate a Unit Census Resident record (set statuscode to inactive)
     * Records are marked inactive instead of deleted to maintain data integrity
     */
    async deactivateUnitCensusResident(recordId: string): Promise<void> {
        try {
            const entity = {
                statecode: 1  // 2 = Inactive (Deactivated)
            };

            await this.context.webAPI.updateRecord("ucm_unitcensusresident", recordId, entity);
        } catch (error) {
            console.error("Error deactivating Unit Census Resident:", error);
            throw error;
        }
    }

}
