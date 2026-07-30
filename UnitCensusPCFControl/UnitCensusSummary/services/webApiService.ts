export interface IPurposeDefinition {
    label: string;
    value: number;
}

/** Web API operations for updating existing Unit Census Resident records. */
export class WebApiService {
    private readonly webApiVersion = "v9.0";

    constructor(private readonly context: ComponentFramework.Context<unknown>) {}

    async getPurposeDefinitions(): Promise<IPurposeDefinition[]> {
        const clientUrl = (this.context as unknown as { page?: { getClientUrl?: () => string } }).page?.getClientUrl?.() ?? window.location.origin;
        const response = await fetch(`${clientUrl}/api/data/${this.webApiVersion}/GlobalOptionSetDefinitions(Name='ucm_purpose')`, {
            headers: { Accept: "application/json", "OData-MaxVersion": "4.0", "OData-Version": "4.0" }
        });
        if (!response.ok) throw new Error("Unable to load Unit Census Resident purpose choices.");

        const result = await response.json() as { Options?: { Value?: number; Label?: { UserLocalizedLabel?: { Label?: string } } }[] };
        return (result.Options ?? []).flatMap(option => {
            const label = option.Label?.UserLocalizedLabel?.Label;
            return option.Value !== undefined && label ? [{ label, value: option.Value }] : [];
        });
    }

    async updatePurpose(recordId: string, purposeValue: number | null): Promise<void> {
        await this.context.webAPI.updateRecord("ucm_unitcensusresident", recordId, { ucm_purpose: purposeValue });
    }
}
