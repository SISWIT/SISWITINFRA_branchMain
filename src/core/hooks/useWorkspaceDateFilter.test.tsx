import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useWorkspaceDateFilter } from "@/core/hooks/useWorkspaceDateFilter";
import { formatWorkspaceDateParam } from "@/core/utils/workspace-date";

function DateFilterProbe() {
  const { selectedDate, effectiveDate, isCurrent, setDate, resetToCurrent } = useWorkspaceDateFilter();
  const [searchParams] = useSearchParams();

  return (
    <div>
      <div data-testid="selected">{selectedDate ? formatWorkspaceDateParam(selectedDate) : ""}</div>
      <div data-testid="effective">{formatWorkspaceDateParam(effectiveDate)}</div>
      <div data-testid="current">{String(isCurrent)}</div>
      <div data-testid="search">{searchParams.toString()}</div>
      <button type="button" onClick={() => setDate(new Date(2026, 3, 10))}>
        set
      </button>
      <button type="button" onClick={() => resetToCurrent()}>
        reset
      </button>
    </div>
  );
}

function renderProbe(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DateFilterProbe />
    </MemoryRouter>,
  );
}

describe("useWorkspaceDateFilter", () => {
  it("reads a valid YYYY-MM-DD query param", () => {
    renderProbe("/organization/performance?date=2026-04-12");

    expect(screen.getByTestId("selected")).toHaveTextContent("2026-04-12");
    expect(screen.getByTestId("current")).toHaveTextContent("false");
  });

  it("removes invalid date query param values", async () => {
    renderProbe("/organization/performance?date=2026-99-99&foo=1");

    await waitFor(() => {
      expect(screen.getByTestId("search").textContent).toBe("foo=1");
    });
    expect(screen.getByTestId("selected")).toBeEmptyDOMElement();
  });

  it("setDate writes the normalized date query param", async () => {
    renderProbe("/organization/performance?foo=1");

    fireEvent.click(screen.getByRole("button", { name: "set" }));

    await waitFor(() => {
      const query = screen.getByTestId("search").textContent ?? "";
      expect(query).toContain("foo=1");
      expect(query).toContain("date=2026-04-10");
    });
  });

  it("resetToCurrent clears date while preserving other params", async () => {
    renderProbe("/organization/performance?date=2026-04-12&foo=1");

    fireEvent.click(screen.getByRole("button", { name: "reset" }));

    await waitFor(() => {
      const query = screen.getByTestId("search").textContent ?? "";
      expect(query).toContain("foo=1");
      expect(query).not.toContain("date=");
      expect(screen.getByTestId("current")).toHaveTextContent("true");
    });
  });

  it("uses local today as effectiveDate when no date is selected", () => {
    renderProbe("/organization/performance");

    expect(screen.getByTestId("current")).toHaveTextContent("true");
    expect(screen.getByTestId("effective")).toHaveTextContent(
      formatWorkspaceDateParam(new Date()),
    );
  });
});
