import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentRestaurant as CurrentRestaurantType } from '../types/current-restaurant.type';

export const CurrentRestaurant = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): CurrentRestaurantType | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.restaurant;
  },
);
