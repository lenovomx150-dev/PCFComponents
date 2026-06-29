/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as React from "react";
import { Stack, Text, TextField, Icon } from "@fluentui/react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { NormalPeoplePicker } from "@fluentui/react/lib/Pickers";

import { IJuvenileRecord, ICensusStatusRow } from "./types";
import { suggestionProps, MASTER_PEOPLE_LIST, INITIAL_CENSUS_ROWS } from "../data/mockData";
import {
    doesTextStartWith,
    removeDuplicates,
    listContainsPersona,
    getTextFromItem,
    validateInput,
    onInputChange,
    onFilterChanged
} from "./helpers";
import { styles, customPickerStyles, stackTokens } from "./styles";

export const DailyCensusSummaryComponent: React.FC = () => {
    // Initializing state groupings mapped by unique keys
    const [data, setData] = React.useState<ICensusStatusRow[]>(INITIAL_CENSUS_ROWS);

    // Aligning left column precisely: Other, AWOL, Home Visit, Court, Intake
    const leftColumn = data.slice(0, 5);
    
    // Aligning right column data status entries: Discharged, Non Billable, Hospital
    const rightColumnData = data.slice(5, 8);

    // Using centralized onFilterChanged from helpers

    const handlePickerChange = (status: string, updatedPersonas?: IPersonaProps[]) => {
        const updatedList = data.map(item => {
            if (item.status === status) {
                return {
                    ...item,
                    residents: updatedPersonas ?? []
                };
            }
            return item;
        });
        setData(updatedList);
    };

    return (
        <div className={styles.root}>
            {/* Horizontal Row Wrapper for Section 1 and Section 2 */}
            <div className={styles.topSectionContainer}>
                
                {/* Section 1: Population Data Summary Area */}
                <div className={styles.sectionCard}>
                    <Text className={styles.sectionHeader}>
                        1. Population Data <span className={styles.subHeaderLabel}>- Read Only</span>
                    </Text>

                    <div className={styles.topLayoutGrid}>
                        {/* Left Column Stack */}
                        <Stack tokens={stackTokens}>
                            {leftColumn.map(item => (
                                <div key={item.status} className={styles.populationRow}>
                                    <Text className={styles.label}>{item.popLabel}</Text>
                                    <TextField
                                        readOnly
                                        value={item.residents.length.toString()}
                                        className={styles.countFieldReadOnly}
                                    />
                                </div>
                            ))}
                        </Stack>

                        {/* Right Column Stack containing data rows + total fields */}
                        <Stack tokens={stackTokens}>
                            {rightColumnData.map(item => (
                                <div key={item.status} className={styles.populationRow}>
                                    <Text className={styles.label}>{item.popLabel}</Text>
                                    <TextField
                                        readOnly
                                        value={item.residents.length.toString()}
                                        className={styles.countFieldReadOnly}
                                    />
                                </div>
                            ))}
                            {/* Appended Missing Totals to cleanly match UI grid specifications */}
                            <div className={styles.populationRow}>
                                <Text className={styles.label}>Other Total</Text>
                                <TextField
                                    readOnly
                                    value="9"
                                    className={styles.countFieldReadOnly}
                                />
                            </div>
                            <div className={styles.populationRow}>
                                <Text className={styles.label}>Actual Total</Text>
                                <TextField
                                    readOnly
                                    value="15"
                                    className={styles.countFieldReadOnly}
                                />
                            </div>
                        </Stack>
                    </div>
                </div>

                {/* Section 2: Present Section */}
                <div className={styles.sectionCard}>
                    <Text className={styles.sectionHeader}>
                        2. Present
                    </Text>
                    <div className={styles.presentRowContainer}>
                        <div className={styles.populationRow}>
                            <Text className={styles.label}>Facility Total</Text>
                            <TextField
                                readOnly
                                value="34"
                                className={styles.countFieldReadOnly}
                            />
                        </div>
                        <div className={styles.populationRow}>
                            <Text className={styles.label}>Assigned Total</Text>
                            <TextField
                                readOnly
                                value="31"
                                className={styles.countFieldReadOnly}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Section 3: Resident Status Interactive Selection Area */}
            <div className={styles.sectionCardWithMargin}>
                <Text className={styles.sectionHeader}>
                    3. Resident Status
                </Text>

                <Stack tokens={{ childrenGap: 12 }}>
                    {data.map(item => (
                        <div key={item.status} className={styles.residentRow}>
                            <div className={styles.residentLabel}>
                                <Text style={{ fontWeight: 500 }}>{item.status}</Text>
                            </div>

                            <TextField
                                readOnly
                                value={item.residents.length.toString()}
                                className={styles.residentCountField}
                            />

                            <div className={styles.pickerWrapper}>
                                <NormalPeoplePicker
                                    onResolveSuggestions={(text, selected) => onFilterChanged(text, selected ?? [])}
                                    getTextFromItem={getTextFromItem}
                                    selectedItems={item.residents}
                                    onChange={(personas) => handlePickerChange(item.status, personas)}
                                    styles={customPickerStyles}
                                    pickerSuggestionsProps={suggestionProps}
                                    onValidateInput={validateInput}
                                    onInputChange={onInputChange}
                                    selectionAriaLabel={"Selected contacts"}
                                    removeButtonAriaLabel={"Remove"}
                                    inputProps={{
                                        "aria-label": `People Picker for ${item.status}`,
                                    }}
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

