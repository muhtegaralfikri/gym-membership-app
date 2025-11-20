import { computeMidtransSignature } from './midtrans-signature';

describe('computeMidtransSignature', () => {
  it('should match Midtrans signature format (sha512 of orderId+statusCode+grossAmount+serverKey)', () => {
    const sig = computeMidtransSignature(
      'order-123',
      '200',
      '50000.00',
      'server-key',
    );
    expect(sig).toBe(
      '826cd1f821891b4bdc201a579f4567c3c9c6525a6e2a65d74df5a28723e00e541c16fc2ba6fd40b3804579526c096bc8bbf2afbd3a326768b23a0c65723ff81b',
    );
  });
});
