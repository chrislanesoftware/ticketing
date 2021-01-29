import {
  Publisher,
  ExpirationCompleteEvent,
  Subjects,
} from '@chrislaneairdatticketing/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
