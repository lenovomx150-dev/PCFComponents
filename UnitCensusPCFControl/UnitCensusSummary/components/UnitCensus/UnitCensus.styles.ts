import { mergeStyleSets } from "@fluentui/react";
import { IBasePickerStyles, IBasePickerSuggestionsProps } from "@fluentui/react/lib/Pickers";

export const suggestionProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: "Suggested Residents",
    mostRecentlyUsedHeaderText: "Recent Records",
    noResultsFoundText: "No matching records found",
    loadingText: "Loading...",
    showRemoveButtons: true,
};

export const styles = mergeStyleSets({
    root: {
        width: "100%",
        padding: "24px",
        background: "#FFFFFF",
        fontFamily: "'Segoe UI', sans-serif",
        boxSizing: "border-box"
    },
    sectionCard: {
        background: "#FAF9F8",
        padding: "20px",
        borderRadius: "4px",
        border: "1px solid #EDEBE9",
        marginBottom: "24px"
    },
    sectionHeader: {
        fontSize: "14px",
        fontWeight: 700,
        color: "#323130",
        marginBottom: "20px",
        display: "block",
        textAlign: "left"
    },
    residentRow: {
        display: "flex",
        alignItems: "center",
        marginBottom: "14px",
        width: "100%"
    },
    residentLabel: {
        width: "280px", 
        fontSize: "13px",
        color: "#323130",
        textAlign: "left"
    },
    residentCountField: {
        width: "45px",
        marginRight: "16px",
        selectors: {
            "& .ms-TextField-fieldGroup": {
                background: "#EDEBE9",
                border: "none",
                borderRadius: "2px"
            },
            "& input": {
                textAlign: "center",
                color: "#323130"
            }
        }
    },
    pickerWrapper: {
        position: "relative",
        flex: 1,
        display: "flex",
        alignItems: "center"
    },
    rightActionIcons: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        color: "#605E5C",
        position: "absolute",
        right: "12px",
        pointerEvents: "none", 
        zIndex: 1
    },
    actionIconItem: {
        fontSize: "14px"
    },
    section3FooterRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: "20px",
        gap: "40px"
    },
    footerItem: {
        display: "flex",
        alignItems: "center",
        gap: "16px"
    },
    footerLabel: {
        fontSize: "13px",
        fontWeight: 600,
        color: "#323130",
        width: "120px"
    },
    footerInputReadOnly: {
        width: "120px",
        selectors: {
            "& .ms-TextField-fieldGroup": {
                background: "#EDEBE9",
                border: "none",
                borderRadius: "2px"
            },
            "& input": {
                textAlign: "left",
                paddingLeft: "8px",
                color: "#323130",
                fontWeight: 500
            }
        }
    }
});

export const customPickerStyles: Partial<IBasePickerStyles> = {
    root: { width: "100%" },
    text: {
        border: "1px solid #D2D0CE",
        borderRadius: "4px",
        minHeight: "32px",
        paddingRight: "52px", 
        background: "#FFFFFF",
        selectors: {
            "&:after": { borderWidth: "1px", borderRadius: "4px" }
        }
    }
};