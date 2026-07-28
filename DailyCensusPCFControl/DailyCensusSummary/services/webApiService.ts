/**
 * Service for the small set of Web API operations a dataset-bound control
 * cannot perform itself: choice metadata and updating a resident's purpose.
 */
export class WebApiService {
    private webApiVersion = "v9.0";
    constructor(private context: ComponentFramework.Context<any>) {}

    /**
     * Fetch global choice options by schema name using the Web API.
     * Works reliably for both global and local option sets.
     */
    async getGlobalChoiceOptions(globalChoiceSchemaName: string): Promise<{ Label: string; Value: number }[]> {
        try {
            const clientUrl = (this.context as any).page?.getClientUrl?.()
                ?? window.location.origin;

            const url = `${clientUrl}/api/data/${this.webApiVersion}/GlobalOptionSetDefinitions(Name='${globalChoiceSchemaName}')`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Dataverse error fetching global choice ${globalChoiceSchemaName}:`, errorText);
                throw new Error(errorText);
            }

            const result = await response.json();
            const options = (result.Options ?? []).map((o: any) => ({
                Value: o.Value,
                Label: o.Label?.UserLocalizedLabel?.Label ?? o.Label?.LocalizedLabels?.[0]?.Label ?? ""
            }));
            return options;
        } catch (error) {
            console.error(`Error fetching global choice options for ${globalChoiceSchemaName}:`, error);
            throw error;
        }
    }

    /**
     * Update a Unit Census Resident record
     */
    async updateUnitCensusResident(
        recordId: string,
        purposeValue: number | null
    ): Promise<void> {
        try {
            const entity: { ucm_purpose: number | null } = {
                ucm_purpose: purposeValue
            };

            await this.context.webAPI.updateRecord("ucm_unitcensusresident", recordId, entity);
        } catch (error) {
            console.error("Error updating Unit Census Resident:", error);
            throw error;
        }
    }

}
