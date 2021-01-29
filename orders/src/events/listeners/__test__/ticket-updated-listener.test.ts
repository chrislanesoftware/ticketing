import { Ticket } from '../../../models/ticket';
import { TicketUpdatedListener } from '../ticket-updated-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { TicketUpdatedEvent } from '@chrislaneairdatticketing/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  // Create an instance of the listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: 10,
    title: 'Le event',
  });

  await ticket.save();

  // create a fake data object
  const data: TicketUpdatedEvent['data'] = {
    version: ticket.version + 1,
    id: ticket.id,
    price: 999,
    title: 'Le event updated',
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, ticket, msg };
};

it('finds, updates and saves a ticket', async () => {
  const { listener, data, msg, ticket } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ticket was updated
  const ticketUpdated = await Ticket.findById(ticket.id);

  expect(ticketUpdated).toBeDefined();
  expect(ticketUpdated!.title).toEqual(data.title);
  expect(ticketUpdated!.price).toEqual(data.price);
  expect(ticketUpdated!.version).toEqual(data.version);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ack function is called
  expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has a skipped version number', async () => {
  const { listener, data, msg, ticket } = await setup();

  // set the version to a much higher number
  data.version = 10;

  // Call on message fucntion with the data + message objects
  try {
    await listener.onMessage(data, msg);
  } catch (error) {}

  expect(msg.ack).not.toHaveBeenCalled();
});
