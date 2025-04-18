import { CSSProperties, ReactNode, useState, useEffect, Fragment } from "react";
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

type FilterType = "text" | "date" | "number" | "dropdown" | "boolean";

type DataType = "text" | "date" | "numeric" | "boolean";

type SelectedRow = DataTableValueArray;

type FiltersObject = DataTableFilterMeta;

type FilterOptions = ColumnFilterElementTemplateOptions;

type BaseColumnProps<T> = {
  field: Extract<keyof T, string>;
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
};

const generateFilters = <T,>(columns: BaseColumnProps<T>[]): FiltersObject => {
  const defaultMatchModes = {
    text: FilterMatchMode.CONTAINS,
    number: FilterMatchMode.EQUALS,
    date: FilterMatchMode.DATE_IS,
    boolean: FilterMatchMode.EQUALS,
    dropdown: FilterMatchMode.IN,
  };

  return columns.reduce<FiltersObject>((acc, col) => {
    if (col.filter) {
      const matchMode = defaultMatchModes[col.filterType || "text"];
      acc[col.field] = { value: null, matchMode };
    }
    return acc;
  }, {});
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

const createFilterElement =
  <T,>(filterType: FilterType, data?: T[]) =>
  (options: FilterOptions) => {
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
  switch (filterType) {
    case "date":
      return renderDateElement(data[field] as Date);
    case "boolean":
      return renderBooleanElement(data[field] as boolean);
    default:
      return data[field];
  }
};

const convertDateData = <T extends Record<string, any>>(data: T[]) => {
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

export default function BaseTable<T extends object>(props: BaseTableProps<T>) {
  const { value, columns, ...rest } = props;
  const [filters, setFilters] = useState<FiltersObject>({});
  const [selected, setSelected] = useState<SelectedRow>([]);

  useEffect(() => {
    setFilters(generateFilters(columns));
  }, []);

  const onRowEditComplete = (e) => {};

  const onEdit = (e) => {};

  const onDelete = (e) => {};

  return (
    <DataTable
      value={hasDateFields(columns) ? convertDateData(value) : value}
      size="large"
      paginator
      rows={10}
      rowsPerPageOptions={[10, 20, 30, 40]}
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
      {columns.map(({ field, header, filterType = "text", ...rest }, i) => (
        <Column
          key={`${field}-${i}`}
          field={field}
          header={header}
          {...rest}
          dataType={getDataType(filterType)}
          showFilterMatchModes={filterType !== "dropdown"}
          filterElement={renderFilterElement(filterType, value)}
          body={(rowData) => renderBodyElement(filterType, field, rowData)}
        />
      ))}
      <Column
        headerStyle={{ width: "1rem" }}
        bodyStyle={{ padding: ".5rem" }}
        body={(rowData: T) => (
          <Button
            icon="pi pi-pencil"
            text
            rounded
            className="opacity-60"
            onClick={() => onEdit(rowData)}
          />
        )}
      ></Column>
      <Column
        headerStyle={{ width: "1rem" }}
        bodyStyle={{ padding: ".5rem" }}
        body={(rowData: T) => (
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            onClick={() => onDelete(rowData)}
          />
        )}
      ></Column>
    </DataTable>
  );
}
