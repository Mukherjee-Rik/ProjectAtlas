import { Injectable } from '@nestjs/common';
import { ReportExecutionResult } from './report-execution-engine.service';

@Injectable()
export class ReportExportService {
  /**
   * Generates a sanitized CSV string from report execution results.
   */
  generateCsv(result: ReportExecutionResult): string {
    const escapeCsv = (val: any) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const headers = result.columns.map((c) => escapeCsv(c.label));

    const rows = result.rows.map((row) => {
      return result.columns
        .map((col) => {
          const val =
            col.key === 'dimensionLabel' ? row.dimensionLabel : row[col.key];
          return escapeCsv(val);
        })
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
