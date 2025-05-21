import {
  CSSProperties,
  ReactNode,
  useState,
  useEffect,
  ChangeEvent,
  useCallback,
} from "react";
import { FilterMatchMode } from "primereact/api";

import {
  DataTable,
  DataTableFilterMeta,
  DataTableValueArray,
} from "primereact/datatable";
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";

type FilterType = "text" | "date" | "number" | "dropdown" | "boolean";

type DataType = "text" | "date" | "numeric" | "boolean";

type SelectedRow = DataTableValueArray;

type FiltersObject = DataTableFilterMeta;

type FilterOptions = ColumnFilterElementTemplateOptions;

export type BaseColumnProps<T> = {
  // field: Extract<keyof T, string>;
  field: string;
  header: string;
  sortable?: boolean;
  filter?: boolean;
  filterType?: FilterType;
  style?: CSSProperties;
  body?: (rowData: T) => ReactNode;
};

type BaseTableProps<T> = {
  value: T[];
  columns: BaseColumnProps<T>[];
  tableStyle?: CSSProperties;
  enableGlobalFilter?: boolean;
  paginator?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
};

const generateFilters = <T,>(columns: BaseColumnProps<T>[]): FiltersObject => {
  const defaultMatchModes = {
    text: FilterMatchMode.CONTAINS,
    number: FilterMatchMode.EQUALS,
    date: FilterMatchMode.DATE_IS,
    boolean: FilterMatchMode.EQUALS,
    dropdown: FilterMatchMode.IN,
  };

  const globalFilter = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  };

  const columnFilters = columns.reduce<FiltersObject>((acc, col) => {
    if (col.filter) {
      const matchMode = defaultMatchModes[col.filterType || "text"];
      acc[col.field] = { value: null, matchMode };
    }
    return acc;
  }, {});

  return { ...globalFilter, ...columnFilters };
};

const getDataType = (filterType: FilterType): DataType | undefined => {
  switch (filterType) {
    case "number":
      return "numeric";
    case "date":
    case "boolean":
      return filterType;
    case "dropdown":
    default:
      return undefined;
  }
};

const createFilterElement = <T,>(filterType: FilterType, data?: T[]) => {
  const FilterElementComponent = (options: FilterOptions) => {
    switch (filterType) {
      case "date":
        return (
          <Calendar
            value={options.value}
            onChange={(e) => {
              console.log(e.value);
              options.filterCallback(e.value, options.index);
            }}
            dateFormat="dd/mm/yy"
            placeholder="dd/mm/yyyy"
            mask="99/99/9999"
          />
        );
      case "boolean":
        return (
          <Dropdown
            value={options.value}
            options={[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ]}
            onChange={(e) => options.filterCallback(e.value, options.index)}
            placeholder="Select"
          />
        );
      case "number":
        return (
          <InputNumber
            value={options.value}
            onChange={(e) => options.filterCallback(e.value, options.index)}
          />
        );
      case "dropdown":
        const dropdownOptions = [
          ...new Set(data?.map((obj) => obj[options.field as keyof T])),
        ];

        return (
          <MultiSelect
            key={options.value}
            value={options.value}
            options={dropdownOptions}
            onChange={(e) => {
              options.filterCallback(e.value);
            }}
            placeholder="Any"
            className="p-column-filter"
          />
        );
      default:
        return null;
    }
  };
  FilterElementComponent.displayName = `FilterElement(${filterType})`;
  return FilterElementComponent;
};

const renderFilterElement = <T,>(filterType: FilterType, value: T[]) =>
  filterType === "dropdown"
    ? createFilterElement(filterType, value)
    : createFilterElement(filterType);

const renderDateElement = (value: Date) => {
  return value.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const renderBooleanElement = (value: boolean) => {
  return <span>{value ? "Yes" : "No"}</span>;
};

const renderBodyElement = <T,>(
  filterType: FilterType,
  field: Extract<keyof T, string>,
  data: T
) => {
  const value = data[field];

  switch (filterType) {
    case "date":
      return value instanceof Date ? renderDateElement(value) : undefined;
    case "boolean":
      return typeof value === "boolean"
        ? renderBooleanElement(value)
        : undefined;
    default:
      return typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";
  }
};

const convertDateData = <T extends Record<string, unknown>>(data: T[]) => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
  return data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (typeof value === "string" && isoDateRegex.test(value)) {
          const parsed = new Date(value);
          return [key, isNaN(parsed.getTime()) ? value : parsed];
        }
        return [key, value];
      })
    )
  );
};

const hasDateFields = <T,>(columns: BaseColumnProps<T>[]) => {
  return columns.some((col) => col.filterType === "date");
};

export default function BaseTable<T extends Record<string, unknown>>(
  props: BaseTableProps<T>
) {
  const { value, columns, paginator, rows, rowsPerPageOptions, ...rest } =
    props;
  const [filters, setFilters] = useState<FiltersObject>({});
  const [selected, setSelected] = useState<SelectedRow>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const initFilters = useCallback(() => {
    setFilters(generateFilters(columns));
    setGlobalFilterValue("");
  }, [columns]); // Memoize with `columns` as a dependency

  useEffect(() => {
    initFilters();
  }, [initFilters]);

  const onRowEditComplete = () => { };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onEdit = (rowData: T) => { };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onDelete = (rowData: T) => { };

  const clearFilter = () => {
    initFilters();
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };

    const globalFilter = _filters["global"];

    if ("value" in globalFilter) {
      globalFilter.value = value;
    }

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-start gap-4">
        <Button
          type="button"
          icon="pi pi-filter-slash"
          label="Clear"
          outlined
          onClick={clearFilter}
        />
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Keyword Search"
          />
        </IconField>
      </div>
    );
  };

  const header = renderHeader();
  const globalFilterFields = Object.keys(filters).filter(
    (key) => key !== "global"
  );

  return (
    <DataTable
      value={hasDateFields(columns) ? convertDateData(value) : value}
      header={header}
      globalFilterFields={globalFilterFields}
      size="large"
      paginator={paginator}
      rows={rows}
      rowsPerPageOptions={rowsPerPageOptions}
      scrollable
      scrollHeight="600px"
      removableSort
      editMode="row"
      onRowEditComplete={onRowEditComplete}
      selection={selected}
      selectionMode="checkbox"
      onSelectionChange={(e) => setSelected(e.value)}
      filters={filters}
      onFilter={(e) => setFilters(e.filters)}
      {...rest}
    >
      <Column selectionMode="multiple" headerStyle={{ width: "3rem" }}></Column>
      {columns.map(
        ({ field, header, filterType, body: columnBody, ...rest }, i) => {
          const filterTypeToUse = filterType || "text";
          return (
            <Column
              key={`${field}-${i}`}
              field={field}
              header={header}
              {...rest}
              dataType={getDataType(filterTypeToUse)}
              showFilterMatchModes={filterTypeToUse !== "dropdown"}
              filterElement={
                rest.filter
                  ? renderFilterElement(filterTypeToUse, value)
                  : undefined
              }
              body={
                columnBody
                  ? columnBody
                  : (rowData) =>
                    renderBodyElement(filterTypeToUse, field, rowData)
              }
            />
          );
        }
      )}
    </DataTable>
  );
}
