import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  formatWorkspaceDateParam,
  isSameLocalDate,
  parseWorkspaceDateParam,
} from "@/core/utils/workspace-date";

export interface WorkspaceDateFilter {
  selectedDate: Date | undefined;
  effectiveDate: Date;
  isCurrent: boolean;
  setDate: (date?: Date) => void;
  resetToCurrent: () => void;
}

export function useWorkspaceDateFilter(): WorkspaceDateFilter {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDate = searchParams.get("date");
  const selectedDate = useMemo(() => parseWorkspaceDateParam(rawDate), [rawDate]);

  useEffect(() => {
    if (!rawDate || selectedDate) return;
    const next = new URLSearchParams(searchParams);
    next.delete("date");
    setSearchParams(next, { replace: true });
  }, [rawDate, searchParams, selectedDate, setSearchParams]);

  const effectiveDate = useMemo(() => selectedDate ?? new Date(), [selectedDate]);
  const isCurrent = useMemo(
    () => !selectedDate || isSameLocalDate(selectedDate, new Date()),
    [selectedDate],
  );

  const setDate = useCallback(
    (date?: Date) => {
      const next = new URLSearchParams(searchParams);
      if (!date) {
        next.delete("date");
      } else {
        next.set("date", formatWorkspaceDateParam(date));
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resetToCurrent = useCallback(() => {
    setDate(undefined);
  }, [setDate]);

  return {
    selectedDate,
    effectiveDate,
    isCurrent,
    setDate,
    resetToCurrent,
  };
}
