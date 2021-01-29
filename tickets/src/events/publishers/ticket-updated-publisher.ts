import {
  Publisher,
  TicketUpdatedEvent,
  Subjects,
} from '@chrislaneairdatticketing/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
