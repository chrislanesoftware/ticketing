import { Message } from 'node-nats-streaming';
import {
  Subjects,
  Listener,
  OrderCancelledEvent,
} from '@chrislaneairdatticketing/common';
import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  readonly queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // Find the ticket the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // If no ticket throw error
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Mark ticket as reserved by setting order Id
    ticket.set({ orderId: undefined });

    // Save the ticket
    await ticket.save();

    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId,
    });

    //ack the message
    msg.ack();
  }
}
