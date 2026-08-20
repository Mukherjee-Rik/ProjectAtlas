import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DATA_SOURCES,
  APPROVED_METRICS,
  APPROVED_DIMENSIONS,
  FILTER_OPERATORS,
  VISUALIZATION_TYPES,
} from '../constants/metric-registry.constants';
import { ReportConfigurationDto } from '../dto/custom-report.dto';

@Injectable()
export class ReportValidatorService {
  /**
   * Validates a complete report configuration against the centralized registry.
   */
  validate(dataSource: string, config: ReportConfigurationDto): void {
    // 1. Validate Data Source
    if (!Object.values(DATA_SOURCES).includes(dataSource as any)) {
      throw new BadRequestException(`Invalid dataSource: "${dataSource}". Must be one of: ${Object.values(DATA_SOURCES).join(', ')}`);
    }

    // 2. Validate Metrics
    if (!config.metrics || config.metrics.length === 0) {
      throw new BadRequestException('At least one metric must be selected');
    }

    config.metrics.forEach((metricKey) => {
      if (!APPROVED_METRICS[metricKey]) {
        throw new BadRequestException(`Invalid metric "${metricKey}". Not found in centralized registry.`);
      }
    });

    // 3. Validate Dimensions
    if (config.dimensions) {
      config.dimensions.forEach((dimKey) => {
        if (!APPROVED_DIMENSIONS[dimKey as keyof typeof APPROVED_DIMENSIONS]) {
          throw new BadRequestException(`Invalid dimension "${dimKey}". Not found in centralized registry.`);
        }
      });
    }

    // 4. Validate Filters
    if (config.filters) {
      config.filters.forEach((f) => {
        if (!f.field || typeof f.field !== 'string') {
          throw new BadRequestException('Filter field must be a non-empty string');
        }
        if (!Object.values(FILTER_OPERATORS).includes(f.operator as any)) {
          throw new BadRequestException(`Invalid filter operator "${f.operator}"`);
        }
        // Protect against SQL injection strings
        const valStr = String(f.value ?? '');
        if (valStr.includes(';') || valStr.toLowerCase().includes('drop table') || valStr.toLowerCase().includes('--')) {
          throw new BadRequestException('Malicious characters detected in filter value');
        }
      });
    }

    // 5. Validate Visualization
    if (!config.visualization?.type || !Object.values(VISUALIZATION_TYPES).includes(config.visualization.type as any)) {
      throw new BadRequestException(`Invalid visualization type "${config.visualization?.type}"`);
    }

    // 6. Validate Limit
    if (config.limit !== undefined && (config.limit < 1 || config.limit > 1000)) {
      throw new BadRequestException('Limit must be between 1 and 1000');
    }
  }
}
