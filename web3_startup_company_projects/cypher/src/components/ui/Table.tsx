'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import { TableColumn, SortConfig } from '@/types';

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  className?: string;
}

export function Table<T extends { id?: string | number }>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  searchable = false,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  className,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery && searchKeys.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number') {
            return value.toString().includes(query);
          }
          return false;
        })
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof T];
        const bVal = b[sortConfig.key as keyof T];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, sortConfig, searchQuery, searchKeys]);

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-cypher-yellow" />
    ) : (
      <ChevronDown className="w-4 h-4 text-cypher-yellow" />
    );
  };

  return (
    <div className={clsx('w-full', className)}>
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cypher-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-cypher-darker border border-cypher-border rounded-lg text-white placeholder-cypher-gray-500 focus:border-cypher-yellow focus:ring-1 focus:ring-cypher-yellow/50 transition-all"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-cypher-border">
        <table className="w-full">
          <thead>
            <tr className="bg-cypher-darker">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={clsx(
                    'text-left text-sm font-medium text-cypher-gray-400 px-4 py-3',
                    column.sortable && 'cursor-pointer select-none hover:text-white',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-cypher-gray-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-cypher-yellow/30 border-t-cypher-yellow rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-cypher-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((item, index) => (
                <tr
                  key={item.id ?? index}
                  className={clsx(
                    'border-t border-cypher-border/50 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-cypher-card/50'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={clsx('px-4 py-4', column.className)}
                    >
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple badge component for table cells
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-cypher-gray-800 text-cypher-gray-300',
    success: 'bg-cypher-green/20 text-cypher-green',
    warning: 'bg-cypher-yellow/20 text-cypher-yellow',
    danger: 'bg-cypher-red/20 text-cypher-red',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
