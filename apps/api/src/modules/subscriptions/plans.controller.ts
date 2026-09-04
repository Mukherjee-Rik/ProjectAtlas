import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard';

@ApiTags('Plans')
@ApiBearerAuth('access-token')
@Controller({
  path: 'plans',
  version: '1',
})
export class PlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Post()
  async createPlan(@Body() body: any) {
    return this.subscriptionsService.createPlan(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findPlanById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.subscriptionsService.findPlanById(id);
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Patch(':id')
  async updatePlan(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: any,
  ) {
    return this.subscriptionsService.updatePlan(id, body);
  }

  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @Delete(':id')
  async deletePlan(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.subscriptionsService.deletePlan(id);
  }
}
