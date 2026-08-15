import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { OrderStatus } from '../../../generated/prisma/enums';

@Injectable()
export class DeliveryEventsService {
  private readonly statusUpdatedSubject = new Subject<{
    orderId: string;
    status: OrderStatus;
    restaurantId: string;
  }>();

  readonly orderStatusUpdated$ = this.statusUpdatedSubject.asObservable();

  emitOrderStatusUpdated(
    orderId: string,
    status: OrderStatus,
    restaurantId: string,
  ) {
    this.statusUpdatedSubject.next({ orderId, status, restaurantId });
  }
}
