declare module 'midtrans-client' {
  export interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface SnapTransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface SnapTransactionItem {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  export interface SnapCustomerDetails {
    first_name: string;
    email: string;
    phone: string;
  }

  export interface SnapTransactionParams {
    transaction_details: SnapTransactionDetails;
    item_details: SnapTransactionItem[];
    customer_details: SnapCustomerDetails;
  }

  export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(config: SnapConfig);
    createTransaction(
      params: SnapTransactionParams,
    ): Promise<SnapTransactionResponse>;
  }
}
