/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import * as React from "react";
import { Stack, Text, TextField, Icon } from "@fluentui/react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { NormalPeoplePicker } from "@fluentui/react/lib/Pickers";

// Internal Relative Module Imports
import { ICensusRow } from "./types";
import { MASTER_PEOPLE_LIST } from "./mockData";
import { styles, customPickerStyles, suggestionProps } from "./UnitCensus.styles";

export const UnitCensusSummaryComponent: React.FC = () => {
    // Section 2 state initialization
    const [activeResidents, setActiveResidents] = React.useState<IPersonaProps[]>([
        MASTER_PEOPLE_LIST[0], // Mason Reed
        MASTER_PEOPLE_LIST[1], // Elijah Brooks
        MASTER_PEOPLE_LIST[2], // Noah Turner
        MASTER_PEOPLE_LIST[3], // Jordan Hayes
        MASTER_PEOPLE_LIST[4]  // Liam Foster
    ]);

    // Section 3 state initialization
    const [inactiveData, setInactiveData] = React.useState<ICensusRow[]>([
        { status: "AWOL", popLabel: "AWOL (5 days or less)", residents: [MASTER_PEOPLE_LIST[5]] }, 
        { status: "Court", popLabel: "Court", residents: [MASTER_PEOPLE_LIST[6]] }, 
        { status: "Home Pass", popLabel: "Home Pass", residents: [MASTER_PEOPLE_LIST[7], MASTER_PEOPLE_LIST[8]] }, 
        { status: "Hospital", popLabel: "Hospital (Carry for entire day)", residents: [MASTER_PEOPLE_LIST[9]] }, 
        { status: "Other", popLabel: "Other", residents: [MASTER_PEOPLE_LIST[10]] } 
    ]);

    // Section 4 state initialization
    const [droppedData, setDroppedData] = React.useState<ICensusRow[]>([
        { status: "AWOL_Drop", popLabel: "AWOL (after 5 days)", residents: [MASTER_PEOPLE_LIST[11]] }, 
        { status: "Court_Drop", popLabel: "Court (after 5 days)", residents: [MASTER_PEOPLE_LIST[12]] }, 
        { status: "Home_Pass_Drop", popLabel: "Home Pass (after 5 days except special holidays)", residents: [MASTER_PEOPLE_LIST[13]] } 
    ]);

    const onFilterChanged = (filterText: string, currentPersonas: IPersonaProps[]): IPersonaProps[] => {
        if (filterText) {
            let filteredPersonas: IPersonaProps[] = MASTER_PEOPLE_LIST.filter(item =>
                item.text?.toLowerCase().startsWith(filterText.toLowerCase())
            );
            return filteredPersonas.filter(persona => !currentPersonas.some(item => item.text === persona.text));
        }
        return [];
    };

    const handleInactivePickerChange = (status: string, updatedPersonas?: IPersonaProps[]) => {
        setInactiveData(prev => prev.map(item => item.status === status ? { ...item, residents: updatedPersonas || [] } : item));
    };

    const handleDroppedPickerChange = (status: string, updatedPersonas?: IPersonaProps[]) => {
        setDroppedData(prev => prev.map(item => item.status === status ? { ...item, residents: updatedPersonas || [] } : item));
    };

    return (
        <div className={styles.root}>
            
            {/* Section 2: Active Residents */}
            <div className={styles.sectionCard}>
                <Text className={styles.sectionHeader}>
                    2. Active Residents (Youth at the time of census)
                </Text>
                <div className={styles.residentRow}>
                    <div className={styles.residentLabel} style={{ width: "135px" }}>
                        <Text style={{ fontWeight: 500 }}>Residents Name</Text>
                    </div>
                    <TextField
                        readOnly
                        value={activeResidents.length.toString()}
                        className={styles.residentCountField}
                    />
                    <div className={styles.pickerWrapper}>
                        <NormalPeoplePicker
                            onResolveSuggestions={(text, selected) => onFilterChanged(text, selected || [])}
                            getTextFromItem={(item) => item.text as string}
                            selectedItems={activeResidents}
                            onChange={(personas) => setActiveResidents(personas || [])}
                            styles={customPickerStyles}
                            pickerSuggestionsProps={suggestionProps}
                        />
                        <div className={styles.rightActionIcons}>
                            <Icon iconName="ChevronDown" className={styles.actionIconItem} style={{ fontSize: 12 }} />
                            <Icon iconName="Search" className={styles.actionIconItem} style={{ fontSize: 13 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Inactive Residents */}
            <div className={styles.sectionCard}>
                <Text className={styles.sectionHeader}>
                    3. Inactive Residents
                </Text>
                <Stack tokens={{ childrenGap: 12 }}>
                    {inactiveData.map(item => (
                        <div key={item.status} className={styles.residentRow}>
                            <div className={styles.residentLabel}>
                                <Text style={{ fontWeight: 500 }}>{item.popLabel}</Text>
                            </div>
                            <TextField
                                readOnly
                                value={item.residents.length.toString()}
                                className={styles.residentCountField}
                            />
                            <div className={styles.pickerWrapper}>
                                <NormalPeoplePicker
                                    onResolveSuggestions={(text, selected) => onFilterChanged(text, selected || [])}
                                    getTextFromItem={(i) => i.text as string}
                                    selectedItems={item.residents}
                                    onChange={(personas) => handleInactivePickerChange(item.status, personas)}
                                    styles={customPickerStyles}
                                    pickerSuggestionsProps={suggestionProps}
                                />
                                <div className={styles.rightActionIcons}>
                                    <Icon iconName="ChevronDown" className={styles.actionIconItem} style={{ fontSize: 12 }} />
                                    <Icon iconName="Search" className={styles.actionIconItem} style={{ fontSize: 13 }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </Stack>

                {/* Horizontal Inline Footer Summary Area */}
                <div className={styles.section3FooterRow}>
                    <div className={styles.footerItem}>
                        <Text className={styles.footerLabel}>Total Inactive</Text>
                        <TextField readOnly value="6" className={styles.residentCountField} />
                    </div>
                    <div className={styles.footerItem} style={{ marginLeft: "24px" }}>
                        <Text className={styles.footerLabel} style={{ width: "140px" }}>In Court after 5 days</Text>
                        <TextField readOnly value="0" className={styles.footerInputReadOnly} />
                    </div>
                </div>
            </div>

            {/* Section 4: Dropped Residents */}
            <div className={styles.sectionCard}>
                <Text className={styles.sectionHeader}>
                    4. Dropped Residents (List for 1 day then drop)
                </Text>
                <Stack tokens={{ childrenGap: 12 }}>
                    {droppedData.map(item => (
                        <div key={item.status} className={styles.residentRow}>
                            <div className={styles.residentLabel}>
                                <Text style={{ fontWeight: 500 }}>{item.popLabel}</Text>
                            </div>
                            <TextField
                                readOnly
                                value={item.residents.length.toString()}
                                className={styles.residentCountField}
                            />
                            <div className={styles.pickerWrapper}>
                                <NormalPeoplePicker
                                    onResolveSuggestions={(text, selected) => onFilterChanged(text, selected || [])}
                                    getTextFromItem={(i) => i.text as string}
                                    selectedItems={item.residents}
                                    onChange={(personas) => handleDroppedPickerChange(item.status, personas)}
                                    styles={customPickerStyles}
                                    pickerSuggestionsProps={suggestionProps}
                                />
                                <div className={styles.rightActionIcons}>
                                    <Icon iconName="ChevronDown" className={styles.actionIconItem} style={{ fontSize: 12 }} />
                                    <Icon iconName="Search" className={styles.actionIconItem} style={{ fontSize: 13 }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </Stack>
            </div>

        </div>
    );
};