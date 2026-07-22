import * as React from "react";
import { Stack, Text, TextField, Icon, Spinner, SpinnerSize } from "@fluentui/react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { NormalPeoplePicker } from "@fluentui/react/lib/Pickers";

import { ICensusStatusRow, IResidentCensusRow } from "./types";
import { styles, customPickerStyles, stackTokens } from "./styles";
import { WebApiService } from "../services/webApiService";

interface IDailyCensusSummaryProps {
    dataset: ComponentFramework.PropertyTypes.DataSet;
    context?: ComponentFramework.Context<any>;
    facilityTotal?: number;
    assignedTotal?: number;
}

interface IJuvenileSearchResult {
    ucm_offenderid: string;
    ucm_fullname?: string;
    ucm_juvenileid?: string;
}

// Fluent's IPersonaProps does not declare an arbitrary data property, but the
// picker needs it to retain the Dataverse row when a resident changes purpose.
type ICensusPersona = IPersonaProps & {
    data?: IResidentCensusRow | IJuvenileSearchResult;
    onClick?: React.MouseEventHandler<HTMLElement>;
};

const STATUS_DEFINITIONS = [
    { status: "Other", popLabel: "Other" },
    { status: "AWOL", popLabel: "AWOL" },
    { status: "Home Pass", popLabel: "Home Visit" },
    { status: "Court", popLabel: "Court" },
    { status: "Intake", popLabel: "Intake" },
    { status: "Discharged", popLabel: "Discharged" },
    { status: "Non-Billable", popLabel: "Non Billable Status" },
    { status: "Hospital", popLabel: "Hospital" }
];

const normalisePurpose = (value: string): string => {
    const purpose = value.trim().toLowerCase();
    const optionSetPurpose: Record<string, string> = {
        "1": "Other",
        "2": "AWOL",
        "3": "Home Pass",
        "4": "Court",
        "5": "Intake",
        "6": "Discharged",
        "7": "Non-Billable",
        "8": "Hospital"
    };
    if (optionSetPurpose[purpose]) return optionSetPurpose[purpose];
    if (!purpose || purpose === "other") return "Other";
    if (purpose === "home visit" || purpose === "home pass") return "Home Pass";
    if (purpose === "non billable" || purpose === "non-billable") return "Non-Billable";
    return STATUS_DEFINITIONS.some(item => item.status.toLowerCase() === purpose)
        ? STATUS_DEFINITIONS.find(item => item.status.toLowerCase() === purpose)!.status
        : "Other";
};

const toPersona = (
    resident: IResidentCensusRow,
    onClick?: React.MouseEventHandler<HTMLElement>
): ICensusPersona => ({
    key: resident.id,
    text: resident.juvenile || resident.facilityRecord || "Resident",
    secondaryText: [resident.unitCensus, resident.facility].filter(Boolean).join(" - "),
    title: [
        resident.juvenile || resident.facilityRecord || "Resident",
        resident.purpose ? `Purpose: ${resident.purpose}` : "Purpose: Not set",
        resident.dailyCensus
    ].filter(Boolean).join(" | "),
    data: resident,
    onClick
});

export const DailyCensusSummaryComponent: React.FC<IDailyCensusSummaryProps> = ({ dataset, context, facilityTotal, assignedTotal }) => {
    const [data, setData] = React.useState<ICensusStatusRow[]>([]);
    const [allActiveJuveniles, setAllActiveJuveniles] = React.useState<any[]>([]);
    const [availableJuveniles, setAvailableJuveniles] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const webApiService = React.useRef<WebApiService | null>(null);
    const [residents, setResidents] = React.useState<IResidentCensusRow[]>([]);
    const [dailyCensusDate, setDailyCensusDate] = React.useState<string>("");
    const [dailyCensusId, setDailyCensusId] = React.useState<string>("");
    const [facilityId, setFacilityId] = React.useState<string>("");

    const openJuvenile = React.useCallback((resident: IResidentCensusRow) => {
        if (resident.juvenileId) {
            context?.navigation.openForm({
                entityName: "ucm_offender",
                entityId: resident.juvenileId
            });
        }
    }, [context]);

    // Initialize Web API service
    React.useEffect(() => {
        if (context) {
            webApiService.current = new WebApiService(context);
        }
    }, [context]);

    // Load data from Web API
    React.useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (!webApiService.current || !context) {
                    throw new Error("Web API service not initialized");
                }

                // PCF controls do not receive formContext. page.entityId identifies the
                // Daily Census record on which this control is rendered.
                const currentDailyCensusId = (context as any).page?.entityId?.replace(/[{}]/g, "");

                if (!currentDailyCensusId) {
                    throw new Error("This control must be placed on a saved Daily Census record.");
                }

                // Load the exact Daily Census record, rather than a different/latest
                // census record for the same facility.
                const dailyCensus = await webApiService.current.getDailyCensus(currentDailyCensusId);
                
                const facilityIdValue = dailyCensus._ucm_facility_value?.replace(/[{}]/g, "");
                if (!facilityIdValue) {
                    throw new Error("The current Daily Census record does not have a facility.");
                }
                setDailyCensusId(currentDailyCensusId);
                setFacilityId(facilityIdValue);

                // Extract the census date from the daily census record and use only the date part
                const censusDate = dailyCensus.createdon ? dailyCensus.createdon.split("T")[0] : "";
                if (!censusDate) {
                    throw new Error("Daily Census date is missing");
                }
                setDailyCensusDate(censusDate);
                
                // Fetch Unit Census Residents for this date and facility
                const loadedResidents = await webApiService.current.getUnitCensusResidents(currentDailyCensusId, censusDate, facilityIdValue);
                setResidents(loadedResidents);
                
                // Fetch ALL ACTIVE juveniles for the search dropdown
                const allActive = await webApiService.current.getAllActiveJuveniles(facilityIdValue);
                setAllActiveJuveniles(allActive);
                
                // Fetch available juveniles (not yet assigned)
                const available = await webApiService.current.getAvailableJuveniles(facilityIdValue, censusDate, currentDailyCensusId);
                setAvailableJuveniles(available);

            } catch (err) {
                console.error("Error loading data:", err);
                setError((err as Error).message || "Failed to load census data");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [context]);

    // Create status rows from residents
    const createStatusRows = React.useCallback((): ICensusStatusRow[] => {
        return STATUS_DEFINITIONS.map(definition => ({
            ...definition,
            residents: residents
                .filter(resident => normalisePurpose(resident.purpose) === definition.status)
                .map(resident => toPersona(resident, () => openJuvenile(resident)))
        }));
    }, [openJuvenile, residents]);

    // Update status rows when residents change
    React.useEffect(() => {
        setData(createStatusRows());
    }, [createStatusRows]);

    const allPeople = React.useMemo(() => residents.map(resident => toPersona(resident)), [residents]);
    
    const resolveSuggestions = (filterText: string, selectedItems?: IPersonaProps[]): ICensusPersona[] => {
        const search = filterText.trim().toLowerCase();
        const selectedKeys = new Set((selectedItems ?? []).map(item => item.key));
        const assignedJuvenileIds = new Set(residents.map(resident => resident.juvenileId).filter(Boolean));

        // A juvenile can belong to only one purpose for this Daily Census.
        const filtered = allActiveJuveniles.filter(juvenile =>
            !selectedKeys.has(juvenile.ucm_offenderid) &&
            !assignedJuvenileIds.has(juvenile.ucm_offenderid) &&
            (search.length === 0 || 
             juvenile.ucm_fullname?.toLowerCase().includes(search) ||
             juvenile.ucm_juvenileid?.toLowerCase().includes(search))
        );

        // Convert to personas
        return filtered.map(juvenile => {
            const existingResident = residents.find(resident => resident.juvenileId === juvenile.ucm_offenderid);
            return {
                key: juvenile.ucm_offenderid,
                text: juvenile.ucm_fullname || "Unknown Juvenile",
                secondaryText: juvenile.ucm_juvenileid || "",
                title: juvenile.ucm_fullname,
                // Retain an existing resident record when a juvenile is moved to
                // another purpose, so that we update it instead of creating a duplicate.
                data: existingResident || juvenile
            };
        });
    };

    const handlePickerChange = async (status: string, updatedPeople?: IPersonaProps[]): Promise<void> => {
        const updated = updatedPeople ?? [];
        const updatedKeys = new Set(updated.map(person => person.key));

        // Update local state
        setData(previous => previous.map(row => {
            if (row.status === status) {
                return { ...row, residents: updated };
            }
            // Adding a resident to a new row moves them out of their prior status.
            return { ...row, residents: row.residents.filter(person => !updatedKeys.has(person.key)) };
        }));

        // Handle record creation/deactivation
        if (webApiService.current && context && dailyCensusId && facilityId && dailyCensusDate) {
            try {
                const currentStatusResidents = data.find(d => d.status === status)?.residents || [];
                
                // Find new additions
                const newResidents = updated.filter(u => !currentStatusResidents.find(c => c.key === u.key));
                
                // Find removed residents
                const removedResidents = currentStatusResidents.filter(c => !updated.find(u => u.key === c.key));

                // Create records for new additions
                for (const newResident of newResidents) {
                    const juvenileData = (newResident as any).data;

                    try {
                        if (juvenileData.recordId) {
                            await webApiService.current.updateUnitCensusResident(juvenileData.recordId, status);
                        } else {
                            await webApiService.current.createUnitCensusResident(
                                juvenileData.ucm_offenderid,
                                dailyCensusId,
                                facilityId,
                                status,
                                dailyCensusDate
                            );
                        }
                    } catch (err) {
                        console.error(`Failed to create record for ${juvenileData.ucm_fullname}:`, err);
                        setError(`Failed to add ${juvenileData.ucm_fullname}: ${(err as Error).message}`);
                    }
                }

                // Deactivate removed residents
                for (const removedResident of removedResidents) {
                    const residentData = (removedResident as any).data as IResidentCensusRow;
                    if (residentData.recordId) {
                        try {
                            await webApiService.current.deactivateUnitCensusResident(residentData.recordId);
                            console.log(`Deactivated record for ${residentData.juvenile}`);
                        } catch (err) {
                            console.error(`Failed to deactivate record for ${residentData.juvenile}:`, err);
                            setError(`Failed to remove ${residentData.juvenile}: ${(err as Error).message}`);
                        }
                    }
                }

                // Refresh data after any changes
                if (newResidents.length > 0 || removedResidents.length > 0) {
                    const updatedResidents = await webApiService.current.getUnitCensusResidents(dailyCensusId, dailyCensusDate, facilityId);
                    setResidents(updatedResidents);

                    // Refresh available juveniles list
                    const updatedAvailable = await webApiService.current.getAvailableJuveniles(facilityId, dailyCensusDate, dailyCensusId);
                    setAvailableJuveniles(updatedAvailable);

                    // Refresh all active juveniles
                    const allActive = await webApiService.current.getAllActiveJuveniles(facilityId);
                    setAllActiveJuveniles(allActive);
                }
            } catch (err) {
                console.error("Error in picker change:", err);
                setError((err as Error).message || "Failed to update resident records");
            }
        }
    };
    const leftColumn = data.slice(0, 5);
    const rightColumnData = data.slice(5);
    const groupedTotal = data.reduce((total, item) => total + item.residents.length, 0);

    const countField = (value: number) => <TextField readOnly value={value.toString()} className={styles.countFieldReadOnly} />;

    if (isLoading) {
        return <div className={styles.root}><Spinner size={SpinnerSize.large} label="Loading census data..." /></div>;
    }

    if (error) {
        return <div className={styles.root}><Text style={{ color: "red" }}>Error: {error}</Text></div>;
    }

    return (
        <div className={styles.root}>
            <div className={styles.topSectionContainer}>
                <div className={styles.sectionCard}>
                    <Text className={styles.sectionHeader}>1. Population Data <span className={styles.subHeaderLabel}>- Read Only</span></Text>
                    <div className={styles.topLayoutGrid}>
                        <Stack tokens={stackTokens}>{leftColumn.map(item => <div key={item.status} className={styles.populationRow}><Text className={styles.label}>{item.popLabel}</Text>{countField(item.residents.length)}</div>)}</Stack>
                        <Stack tokens={stackTokens}>
                            {rightColumnData.map(item => <div key={item.status} className={styles.populationRow}><Text className={styles.label}>{item.popLabel}</Text>{countField(item.residents.length)}</div>)}
                            <div className={styles.populationRow}><Text className={styles.label}>Other Total</Text>{countField(groupedTotal)}</div>
                            <div className={styles.populationRow}><Text className={styles.label}>Actual Total</Text>{countField(residents.length)}</div>
                        </Stack>
                    </div>
                </div>
                <div className={styles.sectionCard}>
                    <Text className={styles.sectionHeader}>2. Present</Text>
                    <div className={styles.presentRowContainer}>
                        <div className={styles.populationRow}><Text className={styles.label}>Facility Total</Text>{countField(facilityTotal ?? residents.length)}</div>
                        <div className={styles.populationRow}><Text className={styles.label}>Assigned Total</Text>{countField(assignedTotal ?? residents.length)}</div>
                    </div>
                </div>
            </div>
            <div className={styles.sectionCardWithMargin}>
                <Text className={styles.sectionHeader}>3. Resident Status</Text>
                <Stack tokens={{ childrenGap: 12 }}>
                    {data.map(item => <div key={item.status} className={styles.residentRow}>
                        <div className={styles.residentLabel}><Text style={{ fontWeight: 500 }}>{item.status}</Text></div>
                        <TextField readOnly value={item.residents.length.toString()} className={styles.residentCountField} />
                        <div className={styles.pickerWrapper}>
                            <NormalPeoplePicker
                                onResolveSuggestions={resolveSuggestions}
                                getTextFromItem={(persona) => persona.text ?? ""}
                                selectedItems={item.residents}
                                onChange={(people) => handlePickerChange(item.status, people)}
                                styles={customPickerStyles}
                                inputProps={{ "aria-label": `Search and add residents with ${item.status} status` }}
                            />
                            <div className={styles.rightActionIcons}><Icon iconName="ChevronDown" className={styles.actionIconItem} style={{ fontSize: 12 }} /><Icon iconName="Search" className={styles.actionIconItem} style={{ fontSize: 13 }} /></div>
                        </div>
                    </div>)}
                </Stack>
            </div>
        </div>
    );
};
