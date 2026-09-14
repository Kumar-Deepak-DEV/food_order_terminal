import type {
  BillResult,
  BillSuccess,
  CartItem,
  Customer,
  DiscountBreakdown,
  OrderStatus,
  Payment,
} from "./types.ts";
import { isMember } from "./customer.ts";
import { calculateSubtotal, calculateItemTotal } from "./cart.ts";
import { processPayment, formatPaymentInfo } from "./payment.ts";
import { availableCoupons } from "./data.ts";
import {
  bold,
  cyan,
  formatCurrency,
  green,
  pad,
  red,
  yellow,
} from "./utils.ts";

const GST_RATE = 0.05; // 5% GST

// Calculates membership and volume discounts
export function calculateDiscount(
  subtotal: number,
  customer: Customer,
  couponCode?: string
): DiscountBreakdown {
  // 1. Membership Discount
  const membershipRate = isMember(customer) ? customer.discountPercentage : 0;
  const membershipDiscount = (subtotal * membershipRate) / 100;

  // 2. Additional 5% discount if subtotal > ₹2000
  const additionalDiscountRate = subtotal > 2000 ? 5 : 0;
  const additionalDiscount = (subtotal * additionalDiscountRate) / 100;

  // 3. Optional Coupon Discount (bonus feature)
  let couponDiscount = 0;
  let appliedCouponCode: string | undefined = undefined;

  if (couponCode !== undefined && couponCode.trim().length > 0) {
    const matchedCoupon = availableCoupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase()
    );

    if (matchedCoupon && subtotal >= matchedCoupon.minSubtotal) {
      appliedCouponCode = matchedCoupon.code;
      if (matchedCoupon.discountType === "flat") {
        couponDiscount = matchedCoupon.value;
      } else {
        couponDiscount = (subtotal * matchedCoupon.value) / 100;
      }
    }
  }

  const rawTotalDiscount =
    membershipDiscount + additionalDiscount + couponDiscount;
  // Total discount cannot exceed the subtotal
  const totalDiscount = Math.min(subtotal, rawTotalDiscount);

  return {
    membershipDiscount: Number(membershipDiscount.toFixed(2)),
    membershipRate,
    additionalDiscount: Number(additionalDiscount.toFixed(2)),
    additionalDiscountRate,
    couponDiscount: Number(couponDiscount.toFixed(2)),
    couponCode: appliedCouponCode,
    totalDiscount: Number(totalDiscount.toFixed(2)),
  };
}

// Calculates 5% GST on the amount after discount
export function calculateTax(amountAfterDiscount: number): number {
  if (amountAfterDiscount <= 0) {
    return 0;
  }
  return Number((amountAfterDiscount * GST_RATE).toFixed(2));
}

// Calculates the final payable amount
export function calculateFinalAmount(
  subtotal: number,
  totalDiscount: number,
  tax: number
): number {
  const afterDiscount = Math.max(0, subtotal - totalDiscount);
  return Number((afterDiscount + tax).toFixed(2));
}

// Generates bill returning a discriminated union (BillSuccess | BillError)
export function generateBill(
  orderId: string,
  customer: Customer,
  cart: CartItem[],
  payment: Payment,
  couponCode?: string,
  currentStatus: OrderStatus = "confirmed"
): BillResult {
  // Error case 1: Cart is empty
  if (cart.length === 0) {
    return {
      status: "error",
      message: "Cannot generate bill: The cart is empty. Add food items first.",
    };
  }

  // Error case 2: Invalid customer name
  if (!customer.name || customer.name.trim().length === 0) {
    return {
      status: "error",
      message: "Cannot generate bill: Customer name is required.",
    };
  }

  // Calculate bill totals
  const subtotal = calculateSubtotal(cart);
  const discountBreakdown = calculateDiscount(subtotal, customer, couponCode);
  const amountAfterDiscount = Math.max(0, subtotal - discountBreakdown.totalDiscount);
  const tax = calculateTax(amountAfterDiscount);
  const finalAmount = calculateFinalAmount(
    subtotal,
    discountBreakdown.totalDiscount,
    tax
  );

  // Validate payment
  const paymentResult = processPayment(payment, finalAmount);
  if (!paymentResult.success) {
    return {
      status: "error",
      message: `Payment processing failed: ${paymentResult.message}`,
    };
  }

  // Success case
  const successfulBill: BillSuccess = {
    status: "success",
    orderId,
    createdAt: new Date().toLocaleString(),
    customer,
    cartItems: [...cart],
    subtotal: Number(subtotal.toFixed(2)),
    discountBreakdown,
    tax,
    finalAmount,
    payment,
    orderStatus: currentStatus,
  };

  return successfulBill;
}

// Formats the bill result for terminal display, narrowing on `status`
export function formatBillOutput(result: BillResult): string {
  // Discriminated union narrowing:
  if (result.status === "error") {
    return [
      red("========================================"),
      red("          BILL GENERATION ERROR         "),
      red("========================================"),
      `Error: ${result.message}`,
      red("========================================"),
    ].join("\n");
  }

  // Here, result is narrowed to BillSuccess
  const divider = "--------------------------------------------------------";
  const doubleDivider = "========================================================";

  const lines: string[] = [
    doubleDivider,
    bold(cyan("                 ORDER RECEIPT & BILL                   ")),
    doubleDivider,
    `Order ID   : ${bold(result.orderId)}`,
    `Date & Time: ${result.createdAt}`,
    `Customer   : ${result.customer.name} (${
      isMember(result.customer)
        ? `${green(result.customer.membershipLevel.toUpperCase())} Member`
        : "Guest"
    })`,
    `Address    : ${result.customer.address.street}, ${result.customer.address.city} - ${result.customer.address.pincode}`,
    divider,
    bold(
      `${pad("Item Name", 28)} ${pad("Qty", 6)} ${pad("Price", 8, "right")} ${pad(
        "Total",
        10,
        "right"
      )}`
    ),
    divider,
  ];

  // List cart items using map()
  result.cartItems.forEach((item: CartItem): void => {
    const itemTotal = calculateItemTotal(item);
    lines.push(
      `${pad(item.name, 28)} ${pad(`x${item.quantity}`, 6)} ${pad(
        formatCurrency(item.price),
        8,
        "right"
      )} ${pad(formatCurrency(itemTotal), 10, "right")}`
    );
    if (item.specialInstruction) {
      lines.push(yellow(`   Note: ${item.specialInstruction}`));
    }
  });

  lines.push(divider);
  lines.push(
    `${pad("Subtotal:", 40)} ${pad(formatCurrency(result.subtotal), 14, "right")}`
  );

  // Discounts
  const { discountBreakdown } = result;
  if (discountBreakdown.membershipDiscount > 0) {
    lines.push(
      `${pad(
        `Membership Discount (${discountBreakdown.membershipRate}%):`,
        40
      )} ${pad(`-${formatCurrency(discountBreakdown.membershipDiscount)}`, 14, "right")}`
    );
  }

  if (discountBreakdown.additionalDiscount > 0) {
    lines.push(
      `${pad(
        `Additional Discount (> ₹2000, 5%):`,
        40
      )} ${pad(`-${formatCurrency(discountBreakdown.additionalDiscount)}`, 14, "right")}`
    );
  }

  if (discountBreakdown.couponDiscount > 0) {
    lines.push(
      `${pad(
        `Coupon [${discountBreakdown.couponCode}]:`,
        40
      )} ${pad(`-${formatCurrency(discountBreakdown.couponDiscount)}`, 14, "right")}`
    );
  }

  const amountAfterDiscount = Math.max(
    0,
    result.subtotal - discountBreakdown.totalDiscount
  );
  lines.push(
    `${pad("Amount After Discount:", 40)} ${pad(
      formatCurrency(amountAfterDiscount),
      14,
      "right"
    )}`
  );
  lines.push(
    `${pad("GST (5%):", 40)} ${pad(formatCurrency(result.tax), 14, "right")}`
  );
  lines.push(divider);
  lines.push(
    bold(
      `${pad("Final Payable Amount:", 40)} ${pad(
        green(formatCurrency(result.finalAmount)),
        14,
        "right"
      )}`
    )
  );
  lines.push(divider);
  lines.push(`Payment Method : ${formatPaymentInfo(result.payment)}`);
  lines.push(`Order Status   : ${bold(result.orderStatus.toUpperCase())}`);
  lines.push(doubleDivider);
  lines.push(bold(green("            Thank you for ordering with us!            ")));
  lines.push(doubleDivider);

  return lines.join("\n");
}
