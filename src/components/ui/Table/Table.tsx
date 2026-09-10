import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import './Table.css';

/* ---- Column Definition ---- */
export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  mono?: boolean;
  coord?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

/* ---- Row Severity ---- */
export type RowSeverity = 'critical' | 'warning' | 'nominal' | 'none';

/* ---- Table Component ---- */
interface TableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: keyof T;
  selectedRowKey?: string | number | null;
  onRowClick?: (row: T) => void;
  getRowSeverity?: (row: T) => RowSeverity;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  selectedRowKey,
  onRowClick,
  getRowSeverity,
  emptyMessage = 'No records found',
  className = '',
  maxHeight,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const result = av! < bv! ? -1 : 1;
      return sortDir === 'asc' ? result : -result;
    });
  }, [data, sortKey, sortDir]);

  return (
    <div
      className={`table-container ${className}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => {
              const key = String(col.key);
              const isSorted = sortKey === key;
              return (
                <th
                  key={key}
                  style={{ width: col.width }}
                  className={[
                    col.sortable ? 'th-sortable' : '',
                    isSorted ? 'th-sorted' : '',
                    col.align === 'right' ? 'th-right' : '',
                    col.align === 'center' ? 'th-center' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={col.sortable ? () => handleSort(key) : undefined}
                  aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.header}
                  {col.sortable && (
                    <span className="th-sort-icon" aria-hidden="true">
                      {isSorted
                        ? sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                        : <ChevronsUpDown size={10} />}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="table-empty">
                  <div className="table-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                  {emptyMessage}
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, i) => {
              const rk = String(row[rowKey]);
              const severity = getRowSeverity?.(row) ?? 'none';
              const isSelected = selectedRowKey != null && rk === String(selectedRowKey);

              return (
                <tr
                  key={rk}
                  className={[
                    isSelected ? 'row-selected' : '',
                    severity !== 'none' ? `row-${severity}` : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onRowClick?.(row)}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map(col => {
                    const key = String(col.key);
                    const cellValue = col.render
                      ? col.render(row, i)
                      : String(row[col.key] ?? '—');

                    return (
                      <td
                        key={key}
                        className={[
                          col.mono ? 'td-mono' : '',
                          col.coord ? 'td-coord' : '',
                          col.align === 'right' ? 'td-right' : '',
                          col.align === 'center' ? 'td-center' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
