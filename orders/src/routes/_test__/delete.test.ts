import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';

it('can only be accessed if the user is signed in', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app).delete(`/api/orders/${id}`).expect(401);
});

it('returns a 404 if the order is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .delete(`/api/orders/${id}`)
    .set('Cookie', global.signin())
    .send()
    .expect(404);
});

it('deletes the order (order marked as cancelled)', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'Thing',
    price: 29,
  });

  await ticket.save();

  const user = global.signin();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  // Make request to delete the order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(204);

  // Check to make sure order is cancelled
  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('returns a 401 if one user tries to delete another users order', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'Thing',
    price: 29,
  });

  await ticket.save();

  const user = global.signin();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  // Make request to delete the order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', global.signin())
    .send()
    .expect(401);
});

it('emits an order cancelled event', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'Thing',
    price: 29,
  });

  await ticket.save();

  const user = global.signin();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  // Make request to delete the order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(204);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
