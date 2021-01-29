import { Order } from '../../../models/order';
import { OrderCancelledListener } from '../order-cancelled-listener';
import { natsWrapper } from '../../../nats-wrapper';
import {
  OrderCancelledEvent,
  OrderStatus,
} from '@chrislaneairdatticketing/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  // Create an order
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price: 10,
    status: OrderStatus.Created,
    userId: 'asasas',
    version: 0,
  });

  await order.save();

  // create a fake data event
  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 1,
    ticket: {
      id: mongoose.Types.ObjectId().toHexString(),
    },
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, order };
};

it('updates the status of the order', async () => {
  const { listener, data, msg, order } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ticket was Cancelled
  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();

  // Call on message fucntion with the data + message objects
  await listener.onMessage(data, msg);

  // Assert ack function is called
  expect(msg.ack).toHaveBeenCalled();
});
