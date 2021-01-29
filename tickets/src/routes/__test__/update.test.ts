import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { natsWrapper } from '../../nats-wrapper';
import { Ticket } from '../../models/ticket';

it('returns a 404 if the ticket does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'asdf',
      price: 20,
    })
    .expect(404);
});

it('returns a 401 if the user is not authenticated', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signin())
    .send({
      title: 'asdf',
      price: 20,
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', global.signin())
    .send({
      title: 'asdf2',
      price: 202,
    })
    .expect(401);
});

it('returns a 400 if the user provides an invalid title or price', async () => {
  const auth = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', auth)
    .send({
      title: 'asdf',
      price: 20,
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', auth)
    .send({
      title: '',
      price: 202,
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', auth)
    .send({
      price: 202,
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', auth)
    .send({
      title: 'Title 2',
      price: -202,
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', auth)
    .send({
      title: 'Title 2',
    })
    .expect(400);
});

it('updates the ticket if everything is valid', async () => {
  const auth = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', auth)
    .send({
      title: 'asdf',
      price: 20,
    })
    .expect(201);

  const title = 'Updated title';
  const price = 10101;

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', auth)
    .send({
      title: title,
      price: price,
    })
    .expect(200);

  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);

  expect(ticketResponse.body.title).toEqual(title);
  expect(ticketResponse.body.price).toEqual(price);
});

it('publishes an event', async () => {
  const auth = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', auth)
    .send({
      title: 'asdf',
      price: 20,
    })
    .expect(201);

  const title = 'Updated title';
  const price = 10101;

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', auth)
    .send({
      title: title,
      price: price,
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('rejects updates if the ticket is reserved', async () => {
  const auth = global.signin();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', auth)
    .send({
      title: 'asdf',
      price: 20,
    })
    .expect(201);

  const ticket = await Ticket.findById(response.body.id);
  ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() });
  await ticket?.save();

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', auth)
    .send({
      title: '1111',
      price: 999,
    })
    .expect(400);
});
