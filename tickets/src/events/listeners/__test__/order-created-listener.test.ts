import { Ticket } from '../../../models/ticket';
import { OrderCreatedListener } from '../order-created-listener';
import { natsWrapper } from '../../../nats-wrapper';
import {
  OrderCreatedEvent,
  OrderStatus,
} from '@chrislaneairdatticketing/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    userId: 'abc',
    price: 10,
    title: 'Le event',
  });

  await ticket.save();

  // create a fake data event
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: 'abc',
    expiresAt: new Date().toISOString(),
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, ticket };
};

it('sets the order Id of the ticket', async () => {
  const { listener, data, msg, ticket } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ticket was created
  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket).toBeDefined();
  expect(updatedTicket!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ack function is called
  expect(msg.ack).toHaveBeenCalled();
});

it('published a ticket updated event', async () => {
  const { listener, data, msg, ticket } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ack function is called
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // Check that published ticket data is correct
  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1],
  );

  expect(data.id).toEqual(ticketUpdatedData.orderId);
});
