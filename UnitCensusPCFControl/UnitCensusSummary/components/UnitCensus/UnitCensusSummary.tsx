import * as React from "react";
import {
  Icon,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { NormalPeoplePicker, PeoplePickerItem, ValidationState } from "@fluentui/react/lib/Pickers";

import {
  IPurposeDefinition,
  WebApiService,
} from "../../services/webApiService";
import { ICensusRow, IUnitCensusResident } from "./types";
import {
  styles,
  customPickerStyles,
  suggestionProps,
} from "./UnitCensus.styles";

interface IUnitCensusSummaryProps {
  context: ComponentFramework.Context<unknown>;
  dataset: ComponentFramework.PropertyTypes.DataSet;
}

type IResidentPersona = IPersonaProps & { data?: IUnitCensusResident };

const dateOnly = (value?: string): string =>
  value ? value.substring(0, 10) : "";
const getDateValue = (
  value:
    | string
    | Date
    | number
    | number[]
    | boolean
    | ComponentFramework.LookupValue
    | ComponentFramework.LookupValue[]
    | ComponentFramework.EntityReference
    | ComponentFramework.EntityReference[],
): string =>
  value instanceof Date
    ? value.toISOString()
    : typeof value === "string"
      ? value
      : "";
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const isOneDayAfterReturn = (
  endDate: string | undefined,
  censusDate: Date,
): boolean =>
  endDate
    ? dateOnly(
        addDays(new Date(`${dateOnly(endDate)}T00:00:00`), 1).toISOString(),
      ) === dateOnly(censusDate.toISOString())
    : false;

const isTemporaryAbsenceStartDate = (
  startDate: string | undefined,
  censusDate: Date,
): boolean =>
  !!startDate && dateOnly(startDate) === dateOnly(censusDate.toISOString());

// An open temporary absence is dropped on the seventh calendar day (start + 6)
// only.  Once it has crossed that point it must not appear again when a return
// date is subsequently entered.  Shorter absences still use the normal
// "one day after return" dropped rule.
const isDroppedResident = (
  resident: IUnitCensusResident,
  censusDate: Date,
): boolean => {
  const startDate = resident.temporaryAbsenceStartDate;
  const endDate = resident.temporaryAbsenceEndDate;
  if (startDate) {
    const longAbsenceDate = addDays(
      new Date(`${dateOnly(startDate)}T00:00:00`),
      6,
    );
    const returnIsOnOrAfterLongAbsenceDate =
      !endDate ||
      new Date(`${dateOnly(endDate)}T00:00:00`) >= longAbsenceDate;

    // The seventh calendar day is the only long-absence Dropped day. A later
    // return date must not prevent this row from being displayed on that day.
    if (returnIsOnOrAfterLongAbsenceDate) {
      return dateOnly(longAbsenceDate.toISOString()) === dateOnly(censusDate.toISOString());
    }
  }

  // Absences that end within five days use the ordinary one-day-after-return rule.
  return isOneDayAfterReturn(endDate, censusDate);
};

const isPastLongAbsenceDropDate = (
  resident: IUnitCensusResident,
  censusDate: Date,
): boolean => {
  const startDate = resident.temporaryAbsenceStartDate;
  if (!startDate) return false;
  const longAbsenceDate = addDays(new Date(`${dateOnly(startDate)}T00:00:00`), 6);
  const endDate = resident.temporaryAbsenceEndDate;
  const returnIsOnOrAfterLongAbsenceDate =
    !endDate || new Date(`${dateOnly(endDate)}T00:00:00`) >= longAbsenceDate;
  return (
    returnIsOnOrAfterLongAbsenceDate &&
    dateOnly(censusDate.toISOString()) > dateOnly(longAbsenceDate.toISOString())
  );
};

const lookupId = (
  record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
  columnName: string,
  fallbackColumnName?: string,
): string | undefined => {
  const directRecord = record as unknown as Record<string, unknown>;
  const value = record.getValue(columnName)
    ?? (fallbackColumnName ? record.getValue(fallbackColumnName) : undefined)
    ?? directRecord[columnName]
    ?? (fallbackColumnName ? directRecord[fallbackColumnName] : undefined);
  const reference = Array.isArray(value) ? value[0] : value;
  if (!reference || typeof reference !== "object" || !("id" in reference)) return undefined;

  const id = reference.id;
  if (typeof id === "string") return id.replace(/[{}]/g, "");
  if (id && typeof id === "object" && "guid" in id && typeof id.guid === "string") {
    return id.guid.replace(/[{}]/g, "");
  }
  return undefined;
};

const toResident = (
  record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
): IUnitCensusResident => ({
  id: record.getRecordId(),
  juvenileId: lookupId(record, "juvenile", "ucm_juvenile"),
  juvenile: record.getFormattedValue("juvenile") || record.getFormattedValue("ucm_juvenile") || "Resident",
  purpose: record.getFormattedValue("purpose"),
  temporaryAbsenceStartDate: getDateValue(
    record.getValue("temporaryabsencestartdate"),
  ),
  temporaryAbsenceEndDate: getDateValue(
    record.getValue("temporaryabsenceenddate"),
  ),
});

const toPersona = (
  resident: IUnitCensusResident,
): IResidentPersona => ({
  key: resident.id,
  text: resident.juvenile,
  title: [
    resident.juvenile,
    resident.purpose,
    resident.temporaryAbsenceEndDate
      ? `Temporary absence end: ${dateOnly(resident.temporaryAbsenceEndDate)}`
      : "",
  ]
    .filter(Boolean)
    .join(" | "),
  // Fluent Persona displays this Dataverse primary image when available and
  // falls back to initials/the default icon when it is not.
  imageUrl: resident.juvenileId
    ? `/Image/download.aspx?Entity=ucm_offender&Attribute=entityimage&Id=${resident.juvenileId}&Full=true`
    : undefined,
  data: resident,
});

export const UnitCensusSummaryComponent: React.FC<IUnitCensusSummaryProps> = ({
  context,
  dataset,
}) => {
  const [purposes, setPurposes] = React.useState<IPurposeDefinition[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const requestedPage = React.useRef<number>();

  // A dataset can be configured with a small page size (for example, four
  // rows). Load every page before calculating any counts. Calling without the
  // loadOnlyNewPage flag retains the complete loaded page range in the dataset.
  React.useEffect(() => {
    if (
      !dataset.loading &&
      dataset.paging.hasNextPage &&
      requestedPage.current !== dataset.paging.lastPageNumber
    ) {
      requestedPage.current = dataset.paging.lastPageNumber;
      dataset.paging.loadNextPage();
    }
  }, [dataset, dataset.loading, dataset.paging.hasNextPage, dataset.paging.lastPageNumber]);

  const residents = dataset.sortedRecordIds.map((id) =>
    toResident(dataset.records[id]),
  );
  const firstRecord = dataset.sortedRecordIds.length
    ? dataset.records[dataset.sortedRecordIds[0]]
    : undefined;
  const censusDate = firstRecord
    ? getDateValue(firstRecord.getValue("date"))
    : undefined;
  const comparisonDate = new Date(censusDate ?? new Date().toISOString());

  React.useEffect(() => {
    const loadPurposes = async (): Promise<void> => {
      try {
        setPurposes(await new WebApiService(context).getPurposeDefinitions());
      } catch (loadError) {
        setError((loadError as Error).message);
      }
    };
    void loadPurposes();
  }, [context]);

  const openResident = React.useCallback(
    (resident: IUnitCensusResident) => {
      if (resident.juvenileId)
        void context.navigation.openForm({
          entityName: "ucm_offender",
          entityId: resident.juvenileId,
        });
    },
    [context],
  );

  const allPersonas = React.useMemo(
    () =>
      residents.map((resident) => toPersona(resident)),
    [openResident, residents],
  );
  const activeResidents = React.useMemo(
    () =>
      residents
        // A youth remains active on the calendar day an absence starts. They
        // move to Inactive on the following day, even when Purpose is already set.
        .filter(
          (resident) =>
            !resident.purpose ||
            isTemporaryAbsenceStartDate(
              resident.temporaryAbsenceStartDate,
              comparisonDate,
            ),
        )
        .map((resident) => toPersona(resident)),
    [comparisonDate, openResident, residents],
  );
  // Render every configured purpose so a resident can be moved into an empty
  // purpose row as well as between rows that already contain residents.
  const inactivePurposes = purposes;
  const inactiveRows = React.useMemo(
    () =>
      inactivePurposes.map((purpose) => ({
        status: purpose.label,
        popLabel: `${purpose.label} (5 days or less)`,
        residents: residents
          .filter(
            (resident) =>
              resident.purpose === purpose.label &&
              !isTemporaryAbsenceStartDate(
                resident.temporaryAbsenceStartDate,
                comparisonDate,
              ) &&
              !isPastLongAbsenceDropDate(resident, comparisonDate) &&
              !isDroppedResident(resident, comparisonDate),
          )
          .map((resident) => toPersona(resident)),
      })),
    [comparisonDate, inactivePurposes, openResident, residents],
  );
  const droppedRows = React.useMemo(
    () =>
      purposes.map((purpose) => ({
        status: purpose.label,
        popLabel: `${purpose.label} (after 5 days)`,
        residents: residents
          .filter(
            (resident) =>
              resident.purpose === purpose.label &&
              isDroppedResident(resident, comparisonDate),
          )
          .map((resident) => toPersona(resident)),
      })),
    [comparisonDate, openResident, purposes, residents],
  );
  const droppedTotal = droppedRows.reduce(
    (total, row) => total + row.residents.length,
    0,
  );

  const resolveSuggestions = React.useCallback(
    (filterText: string, selected?: IPersonaProps[]): IResidentPersona[] => {
      const selectedIds = new Set((selected ?? []).map((item) => item.key));
      const filter = filterText.toLowerCase();
      return allPersonas.filter(
        (person) =>
          !selectedIds.has(person.key) &&
          (!filter || person.text?.toLowerCase().includes(filter)),
      );
    },
    [allPersonas],
  );

  const updatePurpose = async (
    purpose: IPurposeDefinition | undefined,
    existing: IResidentPersona[],
    updated?: IPersonaProps[],
  ): Promise<void> => {
    const existingIds = new Set(existing.map((person) => person.key));
    const updatedIds = new Set((updated ?? []).map((person) => person.key));
    const additions = (updated ?? []).filter(
      (person) => !existingIds.has(person.key),
    );
    const removals = existing.filter((person) => !updatedIds.has(person.key));
    if (!additions.length && !removals.length) return;
    try {
      setIsSaving(true);
      const service = new WebApiService(context);
      await Promise.all(
        [
          // Additions move residents into the selected purpose (or Active when
          // purpose is undefined).
          ...additions.map((person) =>
            service.updatePurpose(String(person.key), purpose?.value ?? null),
          ),
          // Clicking X in an Inactive row clears Purpose. It moves the
          // resident to Active; it never deactivates or deletes the record.
          ...(purpose
            ? removals.map((person) => service.updatePurpose(String(person.key), null))
            : []),
        ],
      );
      dataset.refresh();
    } catch (saveError) {
      setError(
        (saveError as Error).message ||
          "Unable to update Unit Census Resident.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (dataset.loading || dataset.paging.hasNextPage)
    return (
      <div className={styles.root}>
        <Spinner
          size={SpinnerSize.large}
          label="Loading all Unit Census residents..."
        />
      </div>
    );

  const picker = (
    selectedItems: IResidentPersona[],
    onChange: (people?: IPersonaProps[]) => void,
    ariaLabel: string,
    readOnly = false,
  ) => (
    <div className={styles.pickerWrapper}>
      <NormalPeoplePicker
        getTextFromItem={(item) => item.text ?? ""}
        selectedItems={selectedItems}
        onRenderItem={(itemProps) => {
          const resident = itemProps.item as IResidentPersona;
          const peoplePickerItemProps = {
            ...itemProps,
            item: { ...itemProps.item, ValidationState: ValidationState.valid },
          };
          return (
            <div onClick={(event) => {
              if ((event.target as Element).closest("button")) return;
              if (resident.data) openResident(resident.data);
            }}>
              <PeoplePickerItem {...peoplePickerItemProps} />
            </div>
          );
        }}
        onResolveSuggestions={readOnly ? () => [] : resolveSuggestions}
        onEmptyResolveSuggestions={
          readOnly ? undefined : (selected) => resolveSuggestions("", selected)
        }
        onChange={onChange}
        styles={customPickerStyles}
        pickerSuggestionsProps={suggestionProps}
        inputProps={{ readOnly, "aria-label": ariaLabel }}
      />
      <div className={styles.rightActionIcons}>
        <Icon iconName="ChevronDown" className={styles.actionIconItem} />
        <Icon iconName="Search" className={styles.actionIconItem} />
      </div>
    </div>
  );
  const renderRows = (rows: ICensusRow[], editable: boolean) => (
    <Stack tokens={{ childrenGap: 12 }}>
      {rows.map((row) => {
        const purpose = purposes.find((item) => item.label === row.status);
        return (
          <div key={row.status} className={styles.residentRow}>
            <div className={styles.residentLabel}>
              <Text style={{ fontWeight: 500 }}>{row.popLabel}</Text>
            </div>
            <TextField
              readOnly
              value={row.residents.length.toString()}
              className={styles.residentCountField}
            />
            {picker(
              row.residents as IResidentPersona[],
              (people) => {
                if (editable)
                  void updatePurpose(
                    purpose,
                    row.residents as IResidentPersona[],
                    people,
                  );
              },
              row.popLabel,
              !editable,
            )}
          </div>
        );
      })}
    </Stack>
  );

  return (
    <div className={styles.root}>
      {error && (
        <Text style={{ color: "#a4262c", display: "block", marginBottom: 12 }}>
          Error: {error}
        </Text>
      )}
      {isSaving && (
        <Spinner size={SpinnerSize.small} label="Saving resident changes..." />
      )}
      <div className={styles.sectionCard}>
        <Text className={styles.sectionHeader}>
          2. Active Residents (Youth at the time of census)
        </Text>
        <div className={styles.residentRow}>
          <div className={styles.residentLabel}>
            <Text style={{ fontWeight: 500 }}>Residents Name</Text>
          </div>
          <TextField
            readOnly
            value={activeResidents.length.toString()}
            className={styles.residentCountField}
          />
          {picker(
            activeResidents,
            (people) => {
              void updatePurpose(undefined, activeResidents, people);
            },
            "Active residents",
          )}
        </div>
      </div>
      <div className={styles.sectionCard}>
        <Text className={styles.sectionHeader}>3. Inactive Residents</Text>
        {renderRows(inactiveRows, true)}
        <div className={styles.section3FooterRow}>
          <div className={styles.footerItem}>
            <Text className={styles.footerLabel}>Total Inactive</Text>
            <TextField
              readOnly
              value={inactiveRows
                .reduce((total, row) => total + row.residents.length, 0)
                .toString()}
              className={styles.residentCountField}
            />
          </div>
        </div>
      </div>
      <div className={styles.sectionCard}>
        <Text className={styles.sectionHeader}>
          4. Dropped Residents (List for 1 day then drop)
        </Text>
        {renderRows(droppedRows, false)}
        {droppedTotal === 0 && (
          <div className={styles.section3FooterRow}>
            <div className={styles.footerItem}>
              <Text className={styles.footerLabel}>Total Dropped</Text>
              <TextField
                readOnly
                value="0"
                className={styles.residentCountField}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
