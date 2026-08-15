import { Controller, Get, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller({
  path: 'search',
  version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Perform tenant-isolated global search across permitted resources' })
  async search(
    @Query('q') query: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Headers('x-restaurant-id') restaurantId?: string,
  ) {
    return this.searchService.globalSearch(query, userId, role, restaurantId);
  }
}
