"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/DataTable/DataTable";

interface AdminTableSectionProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  getSearchText: (row: T) => string;
}

export function AdminTableSection<T>({
  columns,
  rows,
  isLoading = false,
  searchPlaceholder = "Search...",
  pageSize = 10,
  getSearchText,
}: AdminTableSectionProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      getSearchText(row).toLowerCase().includes(query),
    );
  }, [rows, search, getSearchText]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  return (
    <DataTable
      columns={columns}
      data={pagedRows}
      totalCount={filteredRows.length}
      page={page}
      limit={pageSize}
      isLoading={isLoading}
      searchPlaceholder={searchPlaceholder}
      onSearch={(query) => {
        setPage(1);
        setSearch(query);
      }}
      onPageChange={setPage}
    />
  );
}
