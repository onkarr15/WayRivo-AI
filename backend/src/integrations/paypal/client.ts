import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: { given_name?: string; surname?: string };
  };
  purchase_units?: {
    payments?: {
      captures?: {
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }[];
    };
  }[];
}

export class PayPalClient {
  private apiBase: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.apiBase = env.PAYPAL_API_BASE;
    this.clientId = env.PAYPAL_CLIENT_ID;
    this.clientSecret = env.PAYPAL_CLIENT_SECRET;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      logger.warn('PayPal credentials not configured. Using sandbox simulation mode.');
      return 'MOCK_SANDBOX_ACCESS_TOKEN';
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await fetch(`${this.apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`PayPal OAuth token failed with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.access_token;
    } catch (err: any) {
      logger.error('Failed to obtain PayPal OAuth token:', err);
      return 'FALLBACK_SANDBOX_ACCESS_TOKEN';
    }
  }

  /**
   * Create PayPal Order v2 with Escrow Intent
   */
  async createOrder(params: {
    referenceId: string;
    amount: string;
    currency: string;
    description: string;
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<PayPalOrderResponse> {
    const { referenceId, amount, currency, description, returnUrl, cancelUrl } = params;

    // Real Sandbox Mode if credentials configured
    if (this.clientId && this.clientSecret && !this.clientId.startsWith('AY_Demo')) {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.apiBase}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `order-${referenceId}-${Date.now()}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: referenceId,
              description,
              amount: {
                currency_code: currency,
                value: amount,
              },
            },
          ],
          application_context: {
            brand_name: 'WayRivo AI 2.0',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: returnUrl || 'http://localhost:5173/traveler/bookings',
            cancel_url: cancelUrl || 'http://localhost:5173/traveler/bookings',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal Create Order failed: ${JSON.stringify(errorData)}`);
      }

      return (await response.json()) as PayPalOrderResponse;
    }

    // High-fidelity Sandbox Simulation for development & tests
    const mockOrderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      id: mockOrderId,
      status: 'CREATED',
      links: [
        {
          href: `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`,
          rel: 'approve',
          method: 'GET',
        },
        {
          href: `${this.apiBase}/v2/checkout/orders/${mockOrderId}/capture`,
          rel: 'capture',
          method: 'POST',
        },
      ],
    };
  }

  /**
   * Capture PayPal Order v2
   */
  async captureOrder(paypalOrderId: string): Promise<PayPalCaptureResponse> {
    if (this.clientId && this.clientSecret && !this.clientId.startsWith('AY_Demo')) {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.apiBase}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `capture-${paypalOrderId}-${Date.now()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal Capture Order failed: ${JSON.stringify(errorData)}`);
      }

      return (await response.json()) as PayPalCaptureResponse;
    }

    // High-fidelity Sandbox Simulation
    const mockCaptureId = `CAP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      id: paypalOrderId,
      status: 'COMPLETED',
      payer: {
        email_address: 'sandbox-traveler@wayrivo.com',
        payer_id: 'SB_PAYER_12345',
        name: { given_name: 'Verified', surname: 'Traveler' },
      },
      purchase_units: [
        {
          payments: {
            captures: [
              {
                id: mockCaptureId,
                status: 'COMPLETED',
                amount: { currency_code: 'INR', value: '1000.00' },
              },
            ],
          },
        },
      ],
    };
  }
}

export const paypalClient = new PayPalClient();
