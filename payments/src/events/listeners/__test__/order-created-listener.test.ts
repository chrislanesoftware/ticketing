import { Order } from '../../../models/order';
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

  // create a fake data event
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: 'abc',
    expiresAt: new Date().toISOString(),
    ticket: {
      id: new mongoose.Types.ObjectId().toHexString(),
      price: 101,
    },
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it('replicates the order info', async () => {
  const { listener, data, msg } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ticket was created
  const order = await Order.findById(data.id);

  expect(order).toBeDefined();
  expect(order!.id).toEqual(data.id);
  expect(order!.price).toEqual(data.ticket.price);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ack function is called
  expect(msg.ack).toHaveBeenCalled();
});
