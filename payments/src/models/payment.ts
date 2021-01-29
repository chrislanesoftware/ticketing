import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface PaymentAttrs {
  stripeId: string;
  orderId: string;
  version: number;
}

export interface PaymentDoc extends mongoose.Document {
  stripeId: string;
  orderId: string;
  version: number;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
  FindByEvent(event: {
    id: string;
    version: number;
  }): Promise<PaymentDoc | null>;
}

const paymentSchema = new mongoose.Schema(
  {
    stripeId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  },
);

paymentSchema.set('versionKey', 'version');
paymentSchema.plugin(updateIfCurrentPlugin);

paymentSchema.statics.FindByEvent = (event: {
  id: string;
  version: number;
}) => {
  return Payment.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
  return new Payment(attrs);
};
const Payment = mongoose.model<PaymentDoc, PaymentModel>(
  'Payment',
  paymentSchema,
);

export { Payment };
