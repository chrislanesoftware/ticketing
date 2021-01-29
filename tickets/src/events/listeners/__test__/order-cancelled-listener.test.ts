import { Ticket } from '../../../models/ticket';
import { OrderCancelledListener } from '../order-cancelled-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledEvent } from '@chrislaneairdatticketing/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = new mongoose.Types.ObjectId().toHexString();

  // create and save a ticket
  const ticket = Ticket.build({
    userId: 'abc',
    price: 10,
    title: 'Le event',
  });
  ticket.set({ orderId });
  await ticket.save();

  // create a fake data event
  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, ticket, orderId };
};

it('updates the ticket, publishes an event, acks the message', async () => {
  const { listener, data, msg, ticket } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ticket was Cancelled
  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket).toBeDefined();
  expect(updatedTicket!.orderId).not.toBeDefined();
  expect(msg.ack).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
