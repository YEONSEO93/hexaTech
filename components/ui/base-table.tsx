import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { CSSProperties } from "react";

type BaseColumnProps<T> = {
  field: Extract<keyof T, string>;
  header: string;
  sortable?: boolean;
  style?: CSSProperties;
};

type BaseTableProps<T> = {
  value: T[];
  tableStyle?: CSSProperties;
  columns: BaseColumnProps<T>[];
};

export default function BaseTable<T extends object>(props: BaseTableProps<T>) {
  const { value, columns, ...rest } = props;

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
      {...rest}
    >
      {columns.map((col, i) => (
        <Column key={`${col.field}-${i}`} {...col} />
      ))}
    </DataTable>
  );
}
