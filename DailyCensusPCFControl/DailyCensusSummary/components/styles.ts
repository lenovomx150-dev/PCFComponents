import { mergeStyleSets } from "@fluentui/react";
import { IBasePickerStyles } from "@fluentui/react/lib/Pickers";
import { IStackTokens } from "@fluentui/react";

export const styles = mergeStyleSets({
    root: {
        width: "100%",
        padding: "24px",
        background: "#FFFFFF",
        fontFamily: "'Segoe UI', sans-serif",
        boxSizing: "border-box"
    },
    topSectionContainer: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        columnGap: "24px",
        marginBottom: "24px",
        alignItems: "stretch"
    },
    sectionCard: {
        background: "#FAF9F8",
        padding: "20px",
        borderRadius: "4px",
        border: "1px solid #EDEBE9",
    },
    sectionCardWithMargin: {
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
    subHeaderLabel: {
        fontWeight: 400,
        color: "#797775",
        marginLeft: "4px"
    },
    topLayoutGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        columnGap: "40px",
        alignItems: "start"
    },
    populationRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "32px"
    },
    label: {
        fontSize: "13px",
        color: "#323130",
        width: "150px"
    },
    countFieldReadOnly: {
        width: "120px",
        selectors: {
            "& .ms-TextField-fieldGroup": {
                background: "#E1DFDD",
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
    },
    presentRowContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    residentRow: {
        display: "flex",
        alignItems: "center",
        marginBottom: "14px",
        width: "100%"
    },
    residentLabel: {
        width: "160px",
        fontSize: "13px",
        color: "#323130"
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

export const stackTokens: IStackTokens = { childrenGap: 8 };
