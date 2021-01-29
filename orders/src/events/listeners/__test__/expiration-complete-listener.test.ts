import { Ticket } from '../../../models/ticket';
import { Order } from '../../../models/order';
import { ExpirationCompleteListener } from '../expiration-complete-listener';
import { natsWrapper } from '../../../nats-wrapper';
import {
  ExpirationCompleteEvent,
  OrderStatus,
} from '@chrislaneairdatticketing/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  // Create an instance of the listener
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: 10,
    title: 'Le event',
  });

  await ticket.save();

  // Create and save order
  const order = Order.build({
    status: OrderStatus.Created,
    userId: 'abc',
    expiresAt: new Date(),
    ticket,
  });

  await order.save();

  // create a fake data object
  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id,
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, ticket, order, msg };
};

it('updates the order status to cancelled', async () => {
  const { listener, data, msg, order } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emit an order cancelled event', async () => {
  const { listener, data, msg, order } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const eventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1],
  );

  expect(eventData.id).toEqual(order.id);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
