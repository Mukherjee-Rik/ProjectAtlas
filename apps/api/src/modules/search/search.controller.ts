import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { SearchService } from './search.service';
import { RESTAURANT_HEADER } from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';

@ApiTags('Search')
@ApiBearerAuth('access-token')
@ApiHeader({ name: RESTAURANT_HEADER, required: false })
@Controller({
  path: 'search',
  version: '1',
})
@UseGuards(JwtAuthGuard, RestaurantAccessGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Perform tenant-isolated global search across permitted resources' })
  async search(
    @Query('q') query: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @CurrentRestaurant() restaurant?: CurrentRestaurantType,
  ) {
    return this.searchService.globalSearch(query, userId, role, restaurant?.id);
  }
}
