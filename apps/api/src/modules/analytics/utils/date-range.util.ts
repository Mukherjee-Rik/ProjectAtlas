/**
 * Parses start and end dates with full inclusive time bounds (00:00:00.000 to 23:59:59.999).
 */
export function parseDateBounds(
  dateFrom?: string,
  dateTo?: string,
  defaultDays = 30,
) {
  let end: Date;
  if (!dateTo) {
    end = new Date();
  } else {
    end = new Date(dateTo);
    if (dateTo.length === 10) {
      end.setUTCHours(23, 59, 59, 999);
    }
  }

  let start: Date;
  if (!dateFrom) {
    start = new Date(end.getTime() - defaultDays * 86400000);
    start.setUTCHours(0, 0, 0, 0);
  } else {
    start = new Date(dateFrom);
    if (dateFrom.length === 10) {
      start.setUTCHours(0, 0, 0, 0);
    }
  }

  return { start, end };
}
