import {
  DataTable,
  DataTableFilterMeta,
  DataTableValue,
  DataTableValueArray,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { CSSProperties, ReactNode, useState, useEffect } from "react";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";

type FilterType = "text" | "date" | "number" | "dropdown" | "boolean";

type SelectedRow = DataTableValueArray;

type FiltersObject = DataTableFilterMeta;

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
  tableStyle?: CSSProperties;
  columns: BaseColumnProps<T>[];
  enableGlobalFilter?: boolean;
};

const generateFilters = <T,>(columns: BaseColumnProps<T>[]): FiltersObject => {
  const defaultMatchModes = {
    text: FilterMatchMode.CONTAINS,
    number: FilterMatchMode.EQUALS,
    date: FilterMatchMode.DATE_IS,
    boolean: FilterMatchMode.EQUALS,
    dropdown: FilterMatchMode.EQUALS, // you could make this configurable per column
  };

  return columns.reduce<FiltersObject>((acc, col) => {
    if (col.filter) {
      const matchMode = defaultMatchModes[col.filterType || "text"];
      acc[col.field] = { value: null, matchMode };
    }
    return acc;
  }, {});
};

export default function BaseTable<T extends object>(props: BaseTableProps<T>) {
  const { value, columns, ...rest } = props;
  const [filters, setFilters] = useState<FiltersObject>({});
  const [selected, setSelected] = useState<SelectedRow>([]);

  useEffect(() => {
    setFilters(generateFilters(columns));
  }, [columns]);

  const onRowEditComplete = (e) => {};

  const onEdit = (e) => {};

  const onDelete = (e) => {};

  return (
    <DataTable
      value={value}
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
          showFilterMatchModes={filterType === "text"}
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
