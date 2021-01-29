import {
  Publisher,
  PaymentCreatedEvent,
  Subjects,
} from '@chrislaneairdatticketing/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
