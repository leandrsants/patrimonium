import type { ReactNode } from "react";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  hideOnMobile?: boolean;
  width?: string;
};

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  onRowHref,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  onRowHref?: (row: T) => string;
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className="overflow-x-auto rounded-xl2 border border-line">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-raised">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-ink-faint ${
                  col.align === "right" ? "text-right" : "text-left"
                } ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = onRowHref?.(row);
            const Cells = columns.map((col, i) => (
              <td
                key={i}
                className={`px-4 py-3 align-middle ${col.align === "right" ? "text-right tnum" : "text-left"} ${
                  col.hideOnMobile ? "hidden md:table-cell" : ""
                }`}
              >
                {col.cell(row)}
              </td>
            ));
            return (
              <tr
                key={keyOf(row)}
                className={`border-b border-line/70 transition-colors last:border-0 hover:bg-surface-hover ${href ? "cursor-pointer" : ""}`}
              >
                {Cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
