import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PREBUILT_REPORT_TEMPLATES,
  ReportTemplateDefinition,
} from '../constants/report-templates.constants';
import { ReportService } from './report.service';

@Injectable()
export class ReportTemplateService {
  constructor(private readonly reportService: ReportService) {}

  listTemplates(): ReportTemplateDefinition[] {
    return PREBUILT_REPORT_TEMPLATES;
  }

  getTemplateById(templateId: string): ReportTemplateDefinition {
    const template = PREBUILT_REPORT_TEMPLATES.find((t) => t.id === templateId);
    if (!template)
      throw new NotFoundException(`Template "${templateId}" not found`);
    return template;
  }

  async useTemplate(
    templateId: string,
    restaurantId: string,
    tenantId: string,
    userId: string,
    customName?: string,
  ) {
    const template = this.getTemplateById(templateId);

    return this.reportService.createReport(restaurantId, tenantId, userId, {
      name: customName || template.name,
      description: template.description,
      dataSource: template.dataSource,
      configuration: template.configuration,
      visibility: 'RESTAURANT',
    });
  }
}
