// Reusable Type Aliases
export type ID = number;

export type FoodCategory = "pizza" | "burger" | "drink" | "dessert";

export type MembershipLevel = "silver" | "gold" | "platinum";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "card" | "upi";

// Interfaces for Core Entities
export interface FoodItem {
  readonly id: ID;
  readonly name: string;
  readonly category: FoodCategory;
  readonly price: number;
  isAvailable: boolean;
}

export interface Address {
  readonly street: string;
  readonly city: string;
  readonly pincode: string;
}

export interface Guest {
  readonly id: ID;
  readonly name: string;
  readonly phone?: string;
  readonly address: Address;
}

export interface Member {
  readonly id: ID;
  readonly name: string;
  readonly phone?: string;
  readonly address: Address;
  readonly membershipId: string;
  readonly discountPercentage: number;
  readonly membershipLevel: MembershipLevel;
}

// Union Type: Customer can be either Guest or Member
export type Customer = Guest | Member;

// Order information for cart
export interface OrderItemDetails {
  quantity: number;
  specialInstruction?: string;
}

// Intersection Type (&): FoodItem combined with OrderItemDetails
export type CartItem = FoodItem & OrderItemDetails;

// Payment Interfaces with distinct properties for type narrowing
export interface CashPayment {
  readonly method: "cash";
  readonly receivedAmount: number;
}

export interface CardPayment {
  readonly method: "card";
  readonly last4Digits: string;
  readonly cardHolderName?: string;
}

export interface UpiPayment {
  readonly method: "upi";
  readonly transactionId: string;
  readonly upiId?: string;
}

// Union Type for Payment
export type Payment = CashPayment | CardPayment | UpiPayment;

export interface PaymentResult {
  readonly success: boolean;
  readonly message: string;
  readonly changeDue?: number;
}

// Discount Breakdown details
export interface DiscountBreakdown {
  readonly membershipDiscount: number;
  readonly membershipRate: number;
  readonly additionalDiscount: number;
  readonly additionalDiscountRate: number;
  readonly couponDiscount: number;
  readonly couponCode?: string;
  readonly totalDiscount: number;
}

// Additional Feature: Coupon Model
export interface Coupon {
  readonly code: string;
  readonly description: string;
  readonly discountType: "flat" | "percentage";
  readonly value: number;
  readonly minSubtotal: number;
}

// Discriminated Union for Bill Result
export interface BillSuccess {
  readonly status: "success";
  readonly orderId: string;
  readonly createdAt: string;
  readonly customer: Customer;
  readonly cartItems: CartItem[];
  readonly subtotal: number;
  readonly discountBreakdown: DiscountBreakdown;
  readonly tax: number;
  readonly finalAmount: number;
  readonly payment: Payment;
  readonly orderStatus: OrderStatus;
}

export interface BillError {
  readonly status: "error";
  readonly message: string;
}

export type BillResult = BillSuccess | BillError;
