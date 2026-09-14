import type {
  Payment,
  CashPayment,
  CardPayment,
  UpiPayment,
  PaymentResult,
} from "./types.ts";
import { assertNever, formatCurrency } from "./utils.ts";

// Factory function for Cash payment
export function createCashPayment(receivedAmount: number): CashPayment {
  return {
    method: "cash",
    receivedAmount,
  };
}

// Factory function for Card payment
export function createCardPayment(
  last4Digits: string,
  cardHolderName?: string
): CardPayment {
  return {
    method: "card",
    last4Digits,
    cardHolderName,
  };
}

// Factory function for UPI payment
export function createUpiPayment(
  transactionId: string,
  upiId?: string
): UpiPayment {
  return {
    method: "upi",
    transactionId,
    upiId,
  };
}

// Processes payment using type narrowing (equality checks, 'in' operator, and typeof)
export function processPayment(
  payment: Payment,
  payableAmount: number
): PaymentResult {
  // Method 1: Using equality check and 'in' operator for narrowing
  switch (payment.method) {
    case "cash": {
      // Narrowed to CashPayment. Verifying with 'in' operator:
      if ("receivedAmount" in payment && typeof payment.receivedAmount === "number") {
        if (payment.receivedAmount < payableAmount) {
          const shortage = payableAmount - payment.receivedAmount;
          return {
            success: false,
            message: `Insufficient cash provided. Short by ${formatCurrency(shortage)}.`,
          };
        }
        const changeDue = payment.receivedAmount - payableAmount;
        return {
          success: true,
          message: `Cash payment of ${formatCurrency(payment.receivedAmount)} accepted.`,
          changeDue,
        };
      }
      return {
        success: false,
        message: "Invalid cash amount details.",
      };
    }

    case "card": {
      // Narrowed to CardPayment. Verifying with 'in' operator:
      if ("last4Digits" in payment && typeof payment.last4Digits === "string") {
        const cleanDigits = payment.last4Digits.trim();
        const isValid4Digits = /^\d{4}$/.test(cleanDigits);

        if (!isValid4Digits) {
          return {
            success: false,
            message: "Invalid card digits. Must be exactly 4 numeric digits.",
          };
        }

        return {
          success: true,
          message: `Card payment processed successfully for card ending in ****${cleanDigits}.`,
        };
      }
      return {
        success: false,
        message: "Invalid card details.",
      };
    }

    case "upi": {
      // Narrowed to UpiPayment. Verifying with 'in' operator:
      if ("transactionId" in payment && typeof payment.transactionId === "string") {
        const txnId = payment.transactionId.trim();
        if (txnId.length < 5) {
          return {
            success: false,
            message: "Invalid UPI Transaction ID. Must be at least 5 characters.",
          };
        }

        return {
          success: true,
          message: `UPI payment confirmed with Txn ID: ${txnId}.`,
        };
      }
      return {
        success: false,
        message: "Invalid UPI transaction details.",
      };
    }

    default:
      // Exhaustiveness check using 'never'
      return assertNever(payment);
  }
}

// Formats payment info for receipts using type narrowing
export function formatPaymentInfo(payment: Payment): string {
  if ("receivedAmount" in payment) {
    return `Cash (Received: ${formatCurrency(payment.receivedAmount)})`;
  }
  if ("last4Digits" in payment) {
    const holder = payment.cardHolderName ? ` (${payment.cardHolderName})` : "";
    return `Card ending in ****${payment.last4Digits}${holder}`;
  }
  if ("transactionId" in payment) {
    const upiDetails = payment.upiId ? ` via ${payment.upiId}` : "";
    return `UPI [Ref: ${payment.transactionId}]${upiDetails}`;
  }
  return "Unknown payment method";
}
