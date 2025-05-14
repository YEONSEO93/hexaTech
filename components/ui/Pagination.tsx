"use client";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
};

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between mt-4">
      <Button onClick={() => onPageChange(page - 1)} disabled={page === 0}>
        Previous
      </Button>
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
      >
        Next
      </Button>
    </div>
  );
}
