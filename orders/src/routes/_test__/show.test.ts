import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';

it('can only be accessed if the user is signed in', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app).get(`/api/orders/${id}`).expect(401);
});

it('returns a 404 if the order is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .get(`/api/orders/${id}`)
    .set('Cookie', global.signin())
    .send()
    .expect(404);
});

it('fetches the order', async () => {
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

  // Make request to fetch the order
  const { body: fetchOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(200);

  expect(fetchOrder.id).toEqual(order.id);
});

it('returns a 401 if one user tries to fetch another users order', async () => {
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

  // Make request to fetch the order
  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', global.signin())
    .send()
    .expect(401);
});
