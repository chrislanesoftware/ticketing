import {
  requireAuth,
  validateRequest,
  NotFoundError,
  NotAuthorizedError,
  BadRequestError,
} from '@chrislaneairdatticketing/common';
import { body } from 'express-validator';
import express, { Request, Response } from 'express';
import { Ticket } from '../models/ticket';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put(
  '/api/tickets/:id',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      throw new NotFoundError();
    }

    if (ticket.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (ticket.orderId) {
      throw new BadRequestError('The ticket is reserved and cannot be edited');
    }

    const { title, price } = req.body;

    ticket.set({
      title,
      price,
    });

    await ticket.save();

    new TicketUpdatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
    });

    res.status(200).send(ticket);
  },
);

export { router as updateTicketRouter };
