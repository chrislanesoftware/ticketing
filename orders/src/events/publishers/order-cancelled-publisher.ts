import {
  Publisher,
  OrderCancelledEvent,
  Subjects,
} from '@chrislaneairdatticketing/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
