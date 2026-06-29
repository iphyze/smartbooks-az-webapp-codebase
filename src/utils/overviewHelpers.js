export const overviewPageLimits = [5, 10, 25, 50, 100, 200, 500]
  .map((limit) => ({ id: limit, label: String(limit) }));

export const overviewDeleteActions = [
  { id: "", label: "Select Action" },
  { id: "delete", label: "Delete" },
];

export const getOverviewPageNumbers = (totalPages, currentPage, maxVisiblePages = 5) => {
  const pages = [];
  if (totalPages <= maxVisiblePages) {
    for (let page = 1; page <= totalPages; page += 1) pages.push(page);
    return pages;
  }

  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - maxVisiblePages + 1));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push("...");
  }

  for (let page = startPage; page <= endPage; page += 1) pages.push(page);

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};

export const getOverviewInitials = (value, fallback = "SB") => {
  const initials = String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || fallback;
};

export const formatOverviewDate = (value) => {
  if (!value) return "—";
  const text = String(value);
  const parsed = new Date(text.includes("T") ? text : `${text.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const uniqueOverviewCount = (items, selector) => new Set(
  items.map(selector).filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
).size;

export const formatOverviewNumber = (value) => Number(value || 0).toLocaleString("en-US");
