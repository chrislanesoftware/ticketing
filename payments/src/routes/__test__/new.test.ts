import { OrderStatus } from '@chrislaneairdatticketing/common';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

//jest.mock('../../stripe');

it('has a route handler listening to /api/payments for post request', async () => {
  const response = await request(app).post('/api/payments').send({});

  expect(response.status).not.toEqual(404);
});

it('can only be accessed if the user is signed in', async () => {
  await request(app).post('/api/payments').send({}).expect(401);
});

it('returns a status other than 401 if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('returns an error if an invalid token is provided', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: '',
      orderId: 'abc',
    })
    .expect(400);

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      orderId: 'abc',
    })
    .expect(400);
});

it('returns an error if an invalid orderId is provided', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'lalala',
      orderId: '',
    })
    .expect(400);

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'lalala',
    })
    .expect(400);
});

it('returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'weweew',
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it('returns a 401 when purchasing an order that does not belong to the user', async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price: 101,
    userId: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'weweew',
      orderId: order.id,
    })
    .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price: 101,
    userId,
    version: 0,
    status: OrderStatus.Cancelled,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'weweew',
      orderId: order.id,
    })
    .expect(400);
});

it('returns a 201 with valid inputs', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price,
    userId,
    version: 0,
    status: OrderStatus.Created,
  });

  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({ limit: 50 });
  const stripeCharge = stripeCharges.data.find((charge) => {
    return charge.amount === price * 100;
  });

  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual('gbp');

  // Check payment record was created.
  const payment = await Payment.findOne({
    stripeId: stripeCharge!.id,
    orderId: order.id,
  });

  expect(payment).not.toBeNull();

  // NOTE: Below are expctations for mock stripe api implementation.
  // const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];

  // expect(chargeOptions.source).toEqual('tok_visa');
  // expect(chargeOptions.amount).toEqual(20 * 100);
  // expect(chargeOptions.currency).toEqual('gbp');
});
