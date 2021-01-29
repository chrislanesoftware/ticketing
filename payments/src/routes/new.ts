import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  requireAuth,
  validateRequest,
} from '@chrislaneairdatticketing/common';
import { body } from 'express-validator';
import express, { Request, Response } from 'express';
import { Order } from '../models/order';
import { stripe } from '../stripe';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [
    body('token').not().isEmpty().withMessage('Token is required'),
    body('orderId').not().isEmpty().withMessage('Token is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('The order has been cancelled');
    }

    const charge = await stripe.charges.create({
      currency: 'gbp',
      amount: order.price * 100, //pence
      source: token,
    });

    const payment = Payment.build({
      orderId,
      stripeId: charge.id,
      version: 0,
    });

    await payment.save();

    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    });

    res.status(201).send({ id: payment.id });
  },
);

export { router as createChargeRouter };
