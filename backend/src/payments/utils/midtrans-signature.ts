import * as crypto from 'crypto';

export const computeMidtransSignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
) => {
  return crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
};
