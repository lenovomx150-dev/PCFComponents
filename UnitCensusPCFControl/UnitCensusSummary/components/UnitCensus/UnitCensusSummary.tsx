import * as React from "react";
import { Icon, Spinner, SpinnerSize, Stack, Text, TextField } from "@fluentui/react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { NormalPeoplePicker } from "@fluentui/react/lib/Pickers";

import { ICensusRow, IUnitCensusResident } from "./types";
import { styles, customPickerStyles, suggestionProps } from "./UnitCensus.styles";

interface IUnitCensusSummaryProps {
    context: ComponentFramework.Context<unknown>;
    dataset: ComponentFramework.PropertyTypes.DataSet;
}

const dateOnly = (value?: string): string => value ? value.substring(0, 10) : "";

const getDateValue = (value: string | Date | number | number[] | boolean | ComponentFramework.LookupValue | ComponentFramework.LookupValue[] | ComponentFramework.EntityReference | ComponentFramework.EntityReference[]): string => {
    if (value instanceof Date) return value.toISOString();
    return typeof value === "string" ? value : "";
};

const toResident = (record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord): IUnitCensusResident => ({
    id: record.getRecordId(),
    juvenileId: (record.getValue("juvenile") as ComponentFramework.LookupValue | undefined)?.id,
    juvenile: record.getFormattedValue("juvenile") || "Resident",
    purpose: record.getFormattedValue("purpose"),
    temporaryAbsenceEndDate: getDateValue(record.getValue("temporaryabsenceenddate"))
});

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const isOneDayAfterReturn = (temporaryAbsenceEndDate: string | undefined, today: Date): boolean => {
    if (!temporaryAbsenceEndDate) return false;
    const expectedDate = addDays(new Date(`${dateOnly(temporaryAbsenceEndDate)}T00:00:00`), 1);
    return dateOnly(expectedDate.toISOString()) === dateOnly(today.toISOString());
};

const toPersona = (resident: IUnitCensusResident, onClick: () => void): IPersonaProps => ({
    key: resident.id,
    text: resident.juvenile,
    title: [resident.juvenile, resident.purpose, resident.temporaryAbsenceEndDate ? `Temporary absence end: ${dateOnly(resident.temporaryAbsenceEndDate)}` : ""].filter(Boolean).join(" | "),
    onClick
});

const createRows = (residents: IUnitCensusResident[], suffix: string, predicate: (resident: IUnitCensusResident) => boolean, openResident: (resident: IUnitCensusResident) => void): ICensusRow[] => {
    const grouped = new Map<string, IUnitCensusResident[]>();
    residents.filter(predicate).forEach(resident => {
        const purpose = resident.purpose || "Other";
        grouped.set(purpose, [...(grouped.get(purpose) ?? []), resident]);
    });
    return Array.from(grouped.entries()).map(([purpose, people]) => ({
        status: purpose,
        popLabel: `${purpose} ${suffix}`,
        residents: people.map(person => toPersona(person, () => openResident(person)))
    }));
};

export const UnitCensusSummaryComponent: React.FC<IUnitCensusSummaryProps> = ({ context, dataset }) => {
    const residents = React.useMemo(() => dataset.sortedRecordIds.map(id => toResident(dataset.records[id])), [dataset]);
    const censusDate = React.useMemo(() => {
        const firstRecord = dataset.sortedRecordIds.length ? dataset.records[dataset.sortedRecordIds[0]] : undefined;
        return firstRecord ? getDateValue(firstRecord.getValue("date")) : undefined;
    }, [dataset]);

    const openResident = React.useCallback((resident: IUnitCensusResident) => {
        if (resident.juvenileId) void context.navigation.openForm({ entityName: "ucm_offender", entityId: resident.juvenileId });
    }, [context]);

    const activeResidents = React.useMemo(() => residents.filter(resident => !resident.purpose).map(resident => toPersona(resident, () => openResident(resident))), [openResident, residents]);
    const comparisonDate = React.useMemo(() => new Date(censusDate ?? new Date().toISOString()), [censusDate]);
   // const inactiveRows = React.useMemo(() => createRows(residents, "(5 days or less)", resident => !!resident.purpose && !isOneDayAfterReturn(resident.temporaryAbsenceEndDate, comparisonDate), openResident), [comparisonDate, openResident, residents]);
    const droppedRows = React.useMemo(() => createRows(residents, "(after 5 days)", resident => !!resident.purpose && isOneDayAfterReturn(resident.temporaryAbsenceEndDate, comparisonDate), openResident), [comparisonDate, openResident, residents]);
   // const totalInactive = inactiveRows.reduce((total, row) => total + row.residents.length, 0);

    if (dataset.loading) return <div className={styles.root}><Spinner size={SpinnerSize.large} label="Loading Unit Census residents..." /></div>;

    const renderRows = (rows: ICensusRow[]) => <Stack tokens={{ childrenGap: 12 }}>{rows.map(row => <div key={row.status} className={styles.residentRow}>
        <div className={styles.residentLabel}><Text style={{ fontWeight: 500 }}>{row.popLabel}</Text></div>
        <TextField readOnly value={row.residents.length.toString()} className={styles.residentCountField} />
        <div className={styles.pickerWrapper}><NormalPeoplePicker getTextFromItem={item => item.text ?? ""} selectedItems={row.residents} onResolveSuggestions={() => []} styles={customPickerStyles} pickerSuggestionsProps={suggestionProps} inputProps={{ readOnly: true, "aria-label": row.popLabel }} />
            <div className={styles.rightActionIcons}><Icon iconName="ChevronDown" className={styles.actionIconItem} /><Icon iconName="Search" className={styles.actionIconItem} /></div>
        </div>
    </div>)}</Stack>;

    return <div className={styles.root}>
        <div className={styles.sectionCard}>
            <Text className={styles.sectionHeader}>2. Active Residents (Youth at the time of census)</Text>
            <div className={styles.residentRow}><div className={styles.residentLabel}><Text style={{ fontWeight: 500 }}>Residents Name</Text></div><TextField readOnly value={activeResidents.length.toString()} className={styles.residentCountField} />
                <div className={styles.pickerWrapper}><NormalPeoplePicker getTextFromItem={item => item.text ?? ""} selectedItems={activeResidents} onResolveSuggestions={() => []} styles={customPickerStyles} inputProps={{ readOnly: true, "aria-label": "Active residents" }} /><div className={styles.rightActionIcons}><Icon iconName="ChevronDown" className={styles.actionIconItem} /><Icon iconName="Search" className={styles.actionIconItem} /></div></div>
            </div>
        </div>
        {/* <div className={styles.sectionCard}><Text className={styles.sectionHeader}>3. Inactive Residents</Text>{renderRows(inactiveRows)}
            <div className={styles.section3FooterRow}><div className={styles.footerItem}><Text className={styles.footerLabel}>Total Inactive</Text><TextField readOnly value={totalInactive.toString()} className={styles.residentCountField} /></div></div>
        </div> */}
        <div className={styles.sectionCard}><Text className={styles.sectionHeader}>4. Dropped Residents (List for 1 day then drop)</Text>{renderRows(droppedRows)}</div>
    </div>;
};
