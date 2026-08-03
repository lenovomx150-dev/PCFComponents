import * as React from "react";
import { Stack, Text, TextField, Icon, Spinner, SpinnerSize } from "@fluentui/react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { NormalPeoplePicker, PeoplePickerItem, ValidationState } from "@fluentui/react/lib/Pickers";

import { ICensusStatusRow, IResidentCensusRow } from "./types";
import { styles, customPickerStyles } from "./styles";
import { WebApiService } from "../services/webApiService";

interface IDailyCensusSummaryProps {
    dataset: ComponentFramework.PropertyTypes.DataSet;
    context?: ComponentFramework.Context<any>;
    facilityTotal?: number;
    assignedTotal?: number;
}

interface IPurposeDefinition {
    status: string;
    popLabel: string;
    value: number;
}

type ICensusPersona = IPersonaProps & {
    data?: IResidentCensusRow;
    onClick?: React.MouseEventHandler<HTMLElement>;
};

const normalisePurpose = (value: string, purposes: IPurposeDefinition[]): string => {
    const purpose = value.trim().toLowerCase();
    const matchingPurpose = purposes.find(item =>
        item.status.toLowerCase() === purpose || item.value.toString() === purpose
    );
    return matchingPurpose?.status || "";
};

const formatValue = (record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, name: string, fallbackName?: string): string =>
    record.getFormattedValue(name) || (fallbackName ? record.getFormattedValue(fallbackName) : "") || "";

const lookupId = (record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, name: string, fallbackName?: string): string | undefined => {
    const value = record.getValue(name) ?? (fallbackName ? record.getValue(fallbackName) : undefined);
    const reference = Array.isArray(value) ? value[0] : value;
    return reference && typeof reference === "object" && "id" in reference && typeof reference.id === "string"
        ? reference.id.replace(/[{}]/g, "")
        : undefined;
};

const datasetResidents = (dataset: ComponentFramework.PropertyTypes.DataSet): IResidentCensusRow[] =>
    dataset.sortedRecordIds.map(id => {
        const record = dataset.records[id];
        return {
            id,
            recordId: id,
            juvenile: formatValue(record, "juvenile", "ucm_juvenile"),
            juvenileId: lookupId(record, "juvenile", "ucm_juvenile"),
            facilityRecord: formatValue(record, "facilityrecord", "ucm_facilityrecord"),
            unitCensus: formatValue(record, "unitcensus", "ucm_unitcensus"),
            purpose: formatValue(record, "purpose", "ucm_purpose"),
            dailyCensus: formatValue(record, "dailycensus", "ucm_dailycensus"),
            facility: formatValue(record, "facility", "ucm_facility"),
            date: formatValue(record, "censusdate", "ucm_date"),
            temporaryAbsenceStartDate: formatValue(record, "temporaryabsencestartdate", "ucm_temporaryabsencestartdate"),
            temporaryAbsenceEndDate: formatValue(record, "temporaryabsenceenddate", "ucm_temporaryabsenceenddate")
        };
    });

const toPersona = (resident: IResidentCensusRow, onClick?: React.MouseEventHandler<HTMLElement>): ICensusPersona => ({
    key: resident.id,
    text: resident.juvenile || resident.facilityRecord || "Resident",
    secondaryText: [resident.unitCensus, resident.facility].filter(Boolean).join(" - "),
    title: [
        resident.juvenile || resident.facilityRecord || "Resident",
        resident.purpose ? `Purpose: ${resident.purpose}` : "Purpose: Not set",
        resident.temporaryAbsenceStartDate ? `Absent from: ${resident.temporaryAbsenceStartDate}` : "",
        resident.temporaryAbsenceEndDate ? `Absent until: ${resident.temporaryAbsenceEndDate}` : ""
    ].filter(Boolean).join(" | "),
    data: resident,
    onClick
});

export const DailyCensusSummaryComponent: React.FC<IDailyCensusSummaryProps> = ({ dataset, context }) => {
    const [purposeDefinitions, setPurposeDefinitions] = React.useState<IPurposeDefinition[]>([]);
    const [isLoadingPurposes, setIsLoadingPurposes] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const webApiService = React.useRef<WebApiService | null>(null);

    React.useEffect(() => {
        if (context) {
            webApiService.current = new WebApiService(context);
        }
    }, [context]);

    // The related-record dataset is the source of truth for the rendered census.
    // Records without a Daily Census lookup (the intentional day-after-return rows)
    // are excluded by the related-record view before they reach this control.
    const residents = datasetResidents(dataset);

    React.useEffect(() => {
        const loadPurposes = async () => {
            if (!webApiService.current) {
                return;
            }

            try {
                setIsLoadingPurposes(true);
                setError(null);
                const options = await webApiService.current.getGlobalChoiceOptions("ucm_purpose");
                const purposes = options
                    .filter(option => option.Label && option.Value !== undefined)
                    .map(option => ({ status: option.Label, popLabel: option.Label, value: option.Value }));
                if (!purposes.length) {
                    throw new Error("No choices were found for Unit Census Resident Purpose.");
                }
                setPurposeDefinitions(purposes);
            } catch (err) {
                console.error("Error loading purpose choices:", err);
                setError((err as Error).message || "Failed to load purpose choices");
            } finally {
                setIsLoadingPurposes(false);
            }
        };

        loadPurposes();
    }, [context]);

    const openJuvenile = React.useCallback((resident: IResidentCensusRow) => {
        if (resident.juvenileId) {
            context?.navigation.openForm({ entityName: "ucm_offender", entityId: resident.juvenileId });
        }
    }, [context]);

    const statusRows = React.useMemo<ICensusStatusRow[]>(() => purposeDefinitions.map(definition => ({
        ...definition,
        residents: residents
            .filter(resident => normalisePurpose(resident.purpose, purposeDefinitions) === definition.status)
            .map(resident => toPersona(resident, () => openJuvenile(resident)))
    })), [openJuvenile, purposeDefinitions, residents]);

    const resolveSuggestions = React.useCallback((filterText: string, selectedItems?: IPersonaProps[]): ICensusPersona[] => {
        const search = filterText.trim().toLowerCase();
        const selectedKeys = new Set((selectedItems ?? []).map(item => String(item.key)));
        return residents
            .filter(resident => !selectedKeys.has(resident.id))
            .filter(resident => !search || resident.juvenile.toLowerCase().includes(search) || resident.facilityRecord.toLowerCase().includes(search))
            .map(resident => toPersona(resident));
    }, [residents]);

    const handlePickerChange = async (purpose: IPurposeDefinition, currentResidents: IPersonaProps[], updatedPeople?: IPersonaProps[]): Promise<void> => {
        const updated = updatedPeople ?? [];
        const currentKeys = new Set(currentResidents.map(person => String(person.key)));
        const updatedKeys = new Set(updated.map(person => String(person.key)));
        const added = updated.filter(person => !currentKeys.has(String(person.key)));
        const removed = currentResidents.filter(person => !updatedKeys.has(String(person.key)));

        try {
            setError(null);
            for (const person of added) {
                const resident = (person as ICensusPersona).data;
                if (resident?.recordId) {
                    await webApiService.current?.updateUnitCensusResident(resident.recordId, purpose.value);
                }
            }
            for (const person of removed) {
                const resident = (person as ICensusPersona).data;
                if (resident?.recordId) {
                    await webApiService.current?.updateUnitCensusResident(resident.recordId, null);
                }
            }
            dataset.refresh();
        } catch (err) {
            console.error("Error updating resident purpose:", err);
            setError((err as Error).message || "Failed to update resident purpose");
            dataset.refresh();
        }
    };

    const totalCount = statusRows.reduce((sum, item) => sum + item.residents.length, 0);
    if (dataset.loading || isLoadingPurposes) {
        return <div className={styles.root}><Spinner size={SpinnerSize.large} label="Loading census data..." /></div>;
    }
    if (error) {
        return <div className={styles.root}><Text style={{ color: "red" }}>Error: {error}</Text></div>;
    }

    return <div className={styles.root}>
        <div className={styles.sectionCardWithMargin}>
            <Text className={styles.sectionHeader}>Resident Status</Text>
            <Stack tokens={{ childrenGap: 12 }}>
                {statusRows.map(item => {
                    const purpose = purposeDefinitions.find(definition => definition.status === item.status);
                    if (!purpose) return null;
                    return <div key={item.status} className={styles.residentRow}>
                        <div className={styles.residentLabel}><Text style={{ fontWeight: 500 }}>{item.status}</Text></div>
                        <TextField readOnly value={item.residents.length.toString()} className={styles.residentCountField} />
                        <div className={styles.pickerWrapper}>
                            <NormalPeoplePicker
                                onResolveSuggestions={resolveSuggestions}
                                onEmptyResolveSuggestions={selectedItems => resolveSuggestions("", selectedItems)}
                                getTextFromItem={persona => persona.text ?? ""}
                                selectedItems={item.residents}
                                onRenderItem={pickerItemProps => {
                                    const persona = pickerItemProps.item as ICensusPersona;
                                    const peoplePickerItemProps = {
                                        ...pickerItemProps,
                                        item: { ...pickerItemProps.item, ValidationState: ValidationState.valid }
                                    };
                                    return <div onClick={event => {
                                        // Keep the built-in X behavior. Clicking the standard
                                        // Persona chip itself opens the related Juvenile record.
                                        if ((event.target as Element).closest("button")) return;
                                        if (persona.data) openJuvenile(persona.data);
                                    }}><PeoplePickerItem {...peoplePickerItemProps} /></div>;
                                }}
                                onChange={people => handlePickerChange(purpose, item.residents, people)}
                                styles={customPickerStyles}
                                inputProps={{ "aria-label": `Search and assign residents to ${item.status}` }}
                            />
                            <div className={styles.rightActionIcons}><Icon iconName="ChevronDown" className={styles.actionIconItem} style={{ fontSize: 12 }} /><Icon iconName="Search" className={styles.actionIconItem} style={{ fontSize: 13 }} /></div>
                        </div>
                    </div>;
                })}
                <div className={styles.residentRow}>
                    <div className={styles.residentLabel}><Text style={{ fontWeight: 600, fontSize: "14px", color: "#323130" }}>Total</Text></div>
                    <TextField readOnly value={totalCount.toString()} className={styles.residentCountField} />
                    <div className={styles.pickerWrapper} />
                </div>
            </Stack>
        </div>
    </div>;
};
