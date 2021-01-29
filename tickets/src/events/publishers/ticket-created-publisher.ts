import {
  Publisher,
  TicketCreatedEvent,
  Subjects,
} from '@chrislaneairdatticketing/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject: Subjects.TicketCreated = Subjects.TicketCreated;
}
