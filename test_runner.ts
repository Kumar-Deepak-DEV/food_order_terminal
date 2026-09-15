import type {
  FoodItem,
  Guest,
  Member,
  Customer,
  CartItem,
  Payment,
  OrderStatus,
  BillResult,
} from "./src/types.ts";
import { initialFoodItems, availableCoupons } from "./src/data.ts";
import {
  createGuest,
  createMember,
  isMember,
  getCustomerDiscountRate,
} from "./src/customer.ts";
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  calculateItemTotal,
  calculateSubtotal,
} from "./src/cart.ts";
import {
  createCashPayment,
  createCardPayment,
  createUpiPayment,
  processPayment,
} from "./src/payment.ts";
import {
  calculateDiscount,
  calculateTax,
  calculateFinalAmount,
  generateBill,
  formatBillOutput,
} from "./src/billing.ts";
import {
  updateOrderStatus,
  saveOrderToHistory,
  getOrderHistory,
  findOrderById,
} from "./src/order.ts";

function assert(condition: boolean, testName: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

console.log("=== STARTING COMPREHENSIVE SYSTEM VERIFICATION ===\n");

// 1. Food items requirements: at least 8 items, proper categories
assert(initialFoodItems.length >= 8, "Food items list contains at least 8 items");
const categories = initialFoodItems.map((item: FoodItem) => item.category);
assert(categories.includes("pizza"), "Food items include 'pizza'");
assert(categories.includes("burger"), "Food items include 'burger'");
assert(categories.includes("drink"), "Food items include 'drink'");
assert(categories.includes("dessert"), "Food items include 'dessert'");

// 2. Customer: Guest vs Member union, narrowing
const address = { street: "10 Downing St", city: "Bengaluru", pincode: "560001" };
const guestCustomer: Customer = createGuest(101, "Alice Guest", address, "9876543210");
const memberCustomer: Customer = createMember(102, "Bob Member", address, "gold");

assert(!isMember(guestCustomer), "Guest is not identified as Member");
assert(isMember(memberCustomer), "Member is identified as Member");
assert(getCustomerDiscountRate(guestCustomer) === 0, "Guest discount rate is 0%");
assert(getCustomerDiscountRate(memberCustomer) === 10, "Gold Member discount rate is 10%");

// Silver and Platinum tests
const silverMember = createMember(103, "Charlie Silver", address, "silver");
const platMember = createMember(104, "Diana Plat", address, "platinum");
assert(getCustomerDiscountRate(silverMember) === 5, "Silver discount is 5%");
assert(getCustomerDiscountRate(platMember) === 15, "Platinum discount is 15%");

// 3. Cart operations: addToCart, updateQuantity, removeFromCart, calculateItemTotal, calculateSubtotal
let cart: CartItem[] = [];
const pizza = initialFoodItems[0]; // Margherita Pizza, 299
const burger = initialFoodItems[3]; // Classic Veg Burger, 149
const dessert = initialFoodItems[8]; // Chocolate Lava Cake, 189

cart = addToCart(cart, pizza, 2, "Extra cheese");
assert(cart.length === 1, "Item added to cart");
assert(cart[0].quantity === 2, "Cart item quantity is 2");
assert(cart[0].specialInstruction === "Extra cheese", "Cart item has special instruction");
assert(calculateItemTotal(cart[0]) === 598, "Item total is 2 * 299 = 598");

// Add same item again -> increases quantity
cart = addToCart(cart, pizza, 1);
assert(cart.length === 1 && cart[0].quantity === 3, "Adding existing item increments quantity to 3");

// Add another item
cart = addToCart(cart, burger, 2);
assert(cart.length === 2, "Second item added to cart");
assert(calculateSubtotal(cart) === 3 * 299 + 2 * 149, "Subtotal correctly calculated with reduce");

// Update quantity
cart = updateQuantity(cart, pizza.id, 1);
assert(cart.find((i: CartItem) => i.id === pizza.id)?.quantity === 1, "Quantity updated to 1");

// Remove item
cart = removeFromCart(cart, burger.id);
assert(cart.length === 1 && cart[0].id === pizza.id, "Burger removed from cart");

// 4. Discount rules:
// Rule A: Guest (0%)
const dGuest = calculateDiscount(1000, guestCustomer);
assert(dGuest.membershipDiscount === 0, "Guest gets 0% membership discount");
assert(dGuest.additionalDiscount === 0, "Subtotal <= 2000 gets 0 additional discount");

// Rule B: Member (Gold = 10%) on 1000
const dGold = calculateDiscount(1000, memberCustomer);
assert(dGold.membershipDiscount === 100, "Gold member gets 10% = ₹100 on ₹1000");
assert(dGold.additionalDiscount === 0, "No additional discount under ₹2000");

// Rule C: Subtotal > 2000 triggers additional 5% discount
const dGoldOver2000 = calculateDiscount(2500, memberCustomer);
assert(dGoldOver2000.membershipDiscount === 250, "Gold member gets 10% = ₹250 on ₹2500");
assert(dGoldOver2000.additionalDiscount === 125, "Additional 5% discount on ₹2500 = ₹125");
assert(dGoldOver2000.totalDiscount === 375, "Total discount = ₹375");

// Rule D: Bonus Coupon discounts
const dCoupon = calculateDiscount(1000, guestCustomer, "FOODIE10");
assert(dCoupon.couponDiscount === 100, "10% coupon on ₹1000 gives ₹100 discount");
assert(dCoupon.couponCode === "FOODIE10", "Coupon code recorded");

const dFlatCoupon = calculateDiscount(400, guestCustomer, "WELCOME50");
assert(dFlatCoupon.couponDiscount === 50, "Flat ₹50 coupon applies on subtotal ₹400");

// 5. GST calculation: 5% after discount
const tax = calculateTax(2500 - 375); // 2125 * 0.05 = 106.25
assert(tax === 106.25, "GST is exactly 5% after discount (₹106.25)");

// Final amount calculation
const finalAmt = calculateFinalAmount(2500, 375, tax);
assert(finalAmt === 2231.25, "Final amount = ₹2231.25");

// 6. Payment processing & Narrowing
const cashPayment: Payment = createCashPayment(2500);
const cashResult = processPayment(cashPayment, finalAmt);
assert(cashResult.success && cashResult.changeDue === 2500 - 2231.25, "Cash payment accepted with correct change due");

const badCash: Payment = createCashPayment(2000);
const badCashResult = processPayment(badCash, finalAmt);
assert(!badCashResult.success, "Insufficient cash is rejected");

const cardPayment: Payment = createCardPayment("4321", "Bob Member");
const cardResult = processPayment(cardPayment, finalAmt);
assert(cardResult.success, "Valid 4-digit card payment accepted");

const badCard: Payment = createCardPayment("12A4");
const badCardResult = processPayment(badCard, finalAmt);
assert(!badCardResult.success, "Invalid non-digit card rejected");

const upiPayment: Payment = createUpiPayment("UPI-TXN-987654", "bob@upi");
const upiResult = processPayment(upiPayment, finalAmt);
assert(upiResult.success, "Valid UPI payment accepted");

// 7. Bill Result Discriminated Union
// Error case: empty cart
const emptyBill = generateBill("ORD-001", memberCustomer, [], cardPayment);
assert(emptyBill.status === "error", "Empty cart generates error BillResult");
if (emptyBill.status === "error") {
  assert(emptyBill.message.toLowerCase().includes("cart is empty"), "Error message describes empty cart");
}

// Success case
let testCart: CartItem[] = [];
testCart = addToCart(testCart, pizza, 2);
testCart = addToCart(testCart, burger, 1);
const successBill = generateBill("ORD-002", memberCustomer, testCart, upiPayment);
assert(successBill.status === "success", "Successful BillResult returned");
if (successBill.status === "success") {
  assert(successBill.orderId === "ORD-002", "Order ID matches");
  assert(successBill.cartItems.length === 2, "Cart items recorded");
  assert(successBill.orderStatus === "confirmed", "Initial order status is confirmed");
  const formattedOutput = formatBillOutput(successBill);
  assert(formattedOutput.includes("ORDER RECEIPT & BILL"), "Receipt formatting contains header");
  assert(formattedOutput.includes("UPI"), "Receipt formatting includes payment method");
}

// 8. Order Status & History
assert(updateOrderStatus("pending", "confirmed") === "confirmed", "Status transitions from pending to confirmed");
assert(updateOrderStatus("confirmed", "preparing") === "preparing", "Status transitions to preparing");
assert(updateOrderStatus("preparing", "delivered") === "delivered", "Status transitions to delivered");

let transitionError = false;
try {
  updateOrderStatus("delivered", "cancelled");
} catch {
  transitionError = true;
}
assert(transitionError, "Cannot transition from delivered to cancelled");

if (successBill.status === "success") {
  saveOrderToHistory(successBill);
  assert(getOrderHistory().length >= 1, "Order saved to history");
  const retrieved = findOrderById("ORD-002");
  assert(retrieved !== undefined && retrieved.orderId === "ORD-002", "Order retrieved from history by ID");
}

console.log("\n🎉 ALL TESTS AND ASSERTIONS PASSED SUCCESSFULLY! 100% COMPLIANT WITH ALL REQUIREMENTS.");
