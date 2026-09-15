import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import type {
  CartItem,
  Customer,
  FoodCategory,
  FoodItem,
  MembershipLevel,
  OrderStatus,
  Payment,
} from "./types.ts";
import { initialFoodItems, availableCoupons } from "./data.ts";
import {
  createGuest,
  createMember,
  formatCustomerDetails,
  isMember,
} from "./customer.ts";
import {
  addToCart,
  calculateItemTotal,
  calculateSubtotal,
  clearCart,
  removeFromCart,
  updateQuantity,
} from "./cart.ts";
import {
  createCardPayment,
  createCashPayment,
  createUpiPayment,
} from "./payment.ts";
import {
  calculateDiscount,
  calculateFinalAmount,
  calculateTax,
  formatBillOutput,
  generateBill,
} from "./billing.ts";
import {
  findOrderById,
  formatOrderStatus,
  getOrderHistory,
  saveOrderToHistory,
  updateHistoricalOrderStatus,
} from "./order.ts";
import {
  bold,
  cyan,
  formatCurrency,
  generateOrderId,
  gray,
  green,
  magenta,
  pad,
  red,
  yellow,
} from "./utils.ts";

// Global in-memory state for the active terminal session
let currentCart: CartItem[] = [];
let currentCustomer: Customer = createGuest(1, "Rahul Sharma", {
  street: "123 MG Road",
  city: "Bengaluru",
  pincode: "560001",
});
let activeCouponCode: string | undefined = undefined;

// Creates readline interface for interactive terminal I/O
const rl = readline.createInterface({ input, output });

// Helper to ask a prompt
async function prompt(questionText: string): Promise<string> {
  const answer = await rl.question(questionText);
  return answer.trim();
}

// Display banner
function printHeader(): void {
  console.log("\n" + bold(cyan("========================================================")));
  console.log(bold(cyan("          FOOD ORDERING & BILLING SYSTEM                ")));
  console.log(bold(cyan("========================================================")));
}

// Display active customer and cart summary in menu header
function printStatusSummary(): void {
  const customerType = isMember(currentCustomer)
    ? `${green("Member")} (${currentCustomer.membershipLevel.toUpperCase()} - ${currentCustomer.discountPercentage}% off)`
    : "Guest";

  const totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateSubtotal(currentCart);

  console.log(
    gray(
      `Active Customer: ${currentCustomer.name} [${customerType}] | Cart: ${totalItems} items (${formatCurrency(
        subtotal
      )})${activeCouponCode ? ` | Coupon: ${activeCouponCode}` : ""}`
    )
  );
  console.log(gray("--------------------------------------------------------"));
}

// 1. View Food Menu
async function handleViewMenu(): Promise<void> {
  console.log("\n" + bold("--- FOOD MENU ---"));
  console.log("Filter by Category:");
  console.log("1. All Items");
  console.log("2. Pizza");
  console.log("3. Burger");
  console.log("4. Drinks");
  console.log("5. Desserts");
  console.log("6. Search by name");

  const choice = await prompt("Select an option (1-6) [default: 1]: ");
  let filteredItems: FoodItem[] = initialFoodItems;

  if (choice === "2") {
    filteredItems = initialFoodItems.filter(
      (item: FoodItem) => item.category === "pizza"
    );
  } else if (choice === "3") {
    filteredItems = initialFoodItems.filter(
      (item: FoodItem) => item.category === "burger"
    );
  } else if (choice === "4") {
    filteredItems = initialFoodItems.filter(
      (item: FoodItem) => item.category === "drink"
    );
  } else if (choice === "5") {
    filteredItems = initialFoodItems.filter(
      (item: FoodItem) => item.category === "dessert"
    );
  } else if (choice === "6") {
    const searchKeyword = await prompt("Enter food name to search: ");
    filteredItems = initialFoodItems.filter((item: FoodItem) =>
      item.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }

  if (filteredItems.length === 0) {
    console.log(yellow("No food items found matching your criteria."));
    return;
  }

  console.log("\n" + "=".repeat(65));
  console.log(
    bold(
      `${pad("ID", 4)} ${pad("Item Name", 30)} ${pad("Category", 10)} ${pad(
        "Price",
        8,
        "right"
      )}  ${pad("Status", 10)}`
    )
  );
  console.log("-".repeat(65));

  filteredItems.forEach((item: FoodItem) => {
    const statusStr = item.isAvailable ? green("Available") : red("Sold Out");
    console.log(
      `${pad(item.id.toString(), 4)} ${pad(item.name, 30)} ${pad(
        item.category,
        10
      )} ${pad(formatCurrency(item.price), 8, "right")}  ${pad(statusStr, 10)}`
    );
  });
  console.log("=".repeat(65));
}

// 2. Customer Management
async function handleCustomerManagement(): Promise<void> {
  console.log("\n" + bold("--- CUSTOMER MANAGEMENT ---"));
  console.log("Current Customer Details:");
  console.log(formatCustomerDetails(currentCustomer));
  console.log("\nOptions:");
  console.log("1. Create/Switch to Guest Customer");
  console.log("2. Create/Switch to Member Customer (Silver / Gold / Platinum)");
  console.log("3. Keep Current Customer & Go Back");

  const option = await prompt("Select option (1-3): ");
  if (option === "3" || !option) {
    return;
  }

  const name = await prompt("Enter Customer Name: ");
  if (!name.trim()) {
    console.log(red("Customer name cannot be empty."));
    return;
  }

  const phone = await prompt("Enter Phone Number (optional, press Enter to skip): ");
  const street = await prompt("Enter Street Address: ");
  const city = await prompt("Enter City: ");
  const pincode = await prompt("Enter Pincode: ");

  const address = {
    street: street.trim() || "Main Street",
    city: city.trim() || "Bengaluru",
    pincode: pincode.trim() || "560001",
  };

  const newId = Date.now();

  if (option === "1") {
    currentCustomer = createGuest(
      newId,
      name.trim(),
      address,
      phone.trim() || undefined
    );
    console.log(green(`\nGuest customer '${name}' selected successfully!`));
  } else if (option === "2") {
    console.log("\nSelect Membership Tier:");
    console.log("1. Silver (5% discount)");
    console.log("2. Gold (10% discount)");
    console.log("3. Platinum (15% discount)");

    const tierChoice = await prompt("Select Tier (1-3) [default: 1]: ");
    let level: MembershipLevel = "silver";
    if (tierChoice === "2") level = "gold";
    if (tierChoice === "3") level = "platinum";

    const newMember = createMember(
      newId,
      name.trim(),
      address,
      level,
      phone.trim() || undefined
    );
    currentCustomer = newMember;
    console.log(
      green(
        `\nMember '${name}' created with ${level.toUpperCase()} tier (${newMember.discountPercentage}% off)!`
      )
    );
  }
}

// 3. Add Item to Cart
async function handleAddToCart(): Promise<void> {
  console.log("\n" + bold("--- ADD ITEM TO CART ---"));
  const idInput = await prompt("Enter Food Item ID to add: ");
  const itemId = parseInt(idInput, 10);

  if (isNaN(itemId)) {
    console.log(red("Invalid ID entered. Please enter a valid number."));
    return;
  }

  const foundItem = initialFoodItems.find(
    (item: FoodItem) => item.id === itemId
  );

  if (!foundItem) {
    console.log(red(`No food item found with ID ${itemId}.`));
    return;
  }

  if (!foundItem.isAvailable) {
    console.log(red(`Sorry, '${foundItem.name}' is currently unavailable.`));
    return;
  }

  const qtyInput = await prompt(`Enter quantity for '${foundItem.name}' [default: 1]: `);
  const quantity = qtyInput.trim() === "" ? 1 : parseInt(qtyInput, 10);

  if (isNaN(quantity) || quantity <= 0) {
    console.log(red("Quantity must be a positive number."));
    return;
  }

  const instruction = await prompt(
    "Special instructions (e.g., 'extra cheese', 'less spicy', press Enter to skip): "
  );

  currentCart = addToCart(
    currentCart,
    foundItem,
    quantity,
    instruction.trim() || undefined
  );

  console.log(
    green(
      `Added ${quantity}x '${foundItem.name}' to cart! Subtotal is now ${formatCurrency(
        calculateSubtotal(currentCart)
      )}.`
    )
  );
}

// 4. View Cart
function handleViewCart(): void {
  console.log("\n" + bold("--- CURRENT CART ---"));
  if (currentCart.length === 0) {
    console.log(yellow("Your cart is currently empty."));
    return;
  }

  console.log("=".repeat(65));
  console.log(
    bold(
      `${pad("ID", 4)} ${pad("Item Name", 28)} ${pad("Qty", 6)} ${pad(
        "Price",
        8,
        "right"
      )} ${pad("Total", 12, "right")}`
    )
  );
  console.log("-".repeat(65));

  currentCart.forEach((item: CartItem) => {
    const itemTotal = calculateItemTotal(item);
    console.log(
      `${pad(item.id.toString(), 4)} ${pad(item.name, 28)} ${pad(
        `x${item.quantity}`,
        6
      )} ${pad(formatCurrency(item.price), 8, "right")} ${pad(
        formatCurrency(itemTotal),
        12,
        "right"
      )}`
    );
    if (item.specialInstruction) {
      console.log(yellow(`     Instruction: ${item.specialInstruction}`));
    }
  });

  const subtotal = calculateSubtotal(currentCart);
  console.log("-".repeat(65));
  console.log(
    `${pad("Subtotal:", 48)} ${pad(formatCurrency(subtotal), 12, "right")}`
  );

  // Preview eligible discounts
  const discountBreakdown = calculateDiscount(
    subtotal,
    currentCustomer,
    activeCouponCode
  );
  if (discountBreakdown.totalDiscount > 0) {
    console.log(
      green(
        `${pad("Estimated Discounts:", 48)} ${pad(
          `-${formatCurrency(discountBreakdown.totalDiscount)}`,
          12,
          "right"
        )}`
      )
    );
  }

  const tax = calculateTax(
    Math.max(0, subtotal - discountBreakdown.totalDiscount)
  );
  const finalEst = calculateFinalAmount(
    subtotal,
    discountBreakdown.totalDiscount,
    tax
  );
  console.log(
    bold(
      `${pad("Estimated Total (with 5% GST):", 48)} ${pad(
        formatCurrency(finalEst),
        12,
        "right"
      )}`
    )
  );
  console.log("=".repeat(65));
}

// 5. Update Item Quantity
async function handleUpdateQuantity(): Promise<void> {
  console.log("\n" + bold("--- UPDATE QUANTITY ---"));
  if (currentCart.length === 0) {
    console.log(yellow("Cart is empty. Nothing to update."));
    return;
  }

  handleViewCart();

  const idInput = await prompt("\nEnter Food Item ID to update: ");
  const itemId = parseInt(idInput, 10);

  const cartItem = currentCart.find((item: CartItem) => item.id === itemId);
  if (!cartItem) {
    console.log(red(`Item with ID ${itemId} is not in your cart.`));
    return;
  }

  const qtyInput = await prompt(
    `Enter new quantity for '${cartItem.name}' (current: ${cartItem.quantity}, enter 0 to remove): `
  );
  const newQty = parseInt(qtyInput, 10);

  if (isNaN(newQty) || newQty < 0) {
    console.log(red("Invalid quantity entered."));
    return;
  }

  currentCart = updateQuantity(currentCart, itemId, newQty);
  if (newQty === 0) {
    console.log(green(`Removed '${cartItem.name}' from cart.`));
  } else {
    console.log(
      green(`Updated quantity of '${cartItem.name}' to ${newQty}.`)
    );
  }
}

// 6. Remove Item from Cart
async function handleRemoveItem(): Promise<void> {
  console.log("\n" + bold("--- REMOVE ITEM FROM CART ---"));
  if (currentCart.length === 0) {
    console.log(yellow("Cart is empty."));
    return;
  }

  handleViewCart();

  const idInput = await prompt("\nEnter Food Item ID to remove: ");
  const itemId = parseInt(idInput, 10);

  const cartItem = currentCart.find((item: CartItem) => item.id === itemId);
  if (!cartItem) {
    console.log(red(`Item with ID ${itemId} is not in your cart.`));
    return;
  }

  currentCart = removeFromCart(currentCart, itemId);
  console.log(green(`Removed '${cartItem.name}' from cart.`));
}

// 7. Apply / Remove Coupon
async function handleCoupons(): Promise<void> {
  console.log("\n" + bold("--- COUPONS & OFFERS ---"));
  console.log("Available Coupons:");
  availableCoupons.forEach((coupon) => {
    console.log(
      ` - ${bold(coupon.code)}: ${coupon.description} (Min Subtotal: ${formatCurrency(
        coupon.minSubtotal
      )})`
    );
  });

  if (activeCouponCode) {
    console.log(green(`\nCurrently applied coupon: ${activeCouponCode}`));
    const removeChoice = await prompt("Do you want to remove this coupon? (y/n): ");
    if (removeChoice.toLowerCase() === "y") {
      activeCouponCode = undefined;
      console.log(green("Coupon removed successfully."));
      return;
    }
  }

  const codeInput = await prompt("\nEnter coupon code to apply (or press Enter to cancel): ");
  if (!codeInput.trim()) {
    return;
  }

  const subtotal = calculateSubtotal(currentCart);
  const matched = availableCoupons.find(
    (c) => c.code.toUpperCase() === codeInput.trim().toUpperCase()
  );

  if (!matched) {
    console.log(red(`Invalid coupon code '${codeInput}'.`));
    return;
  }

  if (subtotal < matched.minSubtotal) {
    console.log(
      yellow(
        `Subtotal (${formatCurrency(
          subtotal
        )}) is below minimum required (${formatCurrency(
          matched.minSubtotal
        )}) for ${matched.code}.`
      )
    );
    activeCouponCode = matched.code;
    console.log(
      cyan(`Coupon '${matched.code}' saved and will activate once subtotal exceeds ${formatCurrency(matched.minSubtotal)}.`)
    );
    return;
  }

  activeCouponCode = matched.code;
  console.log(green(`Coupon '${matched.code}' applied successfully!`));
}

// 8. Checkout & Process Payment
async function handleCheckout(): Promise<void> {
  console.log("\n" + bold("--- CHECKOUT & PAYMENT ---"));
  if (currentCart.length === 0) {
    console.log(yellow("Cart is empty. Please add items before checking out."));
    return;
  }

  const subtotal = calculateSubtotal(currentCart);
  const discountBreakdown = calculateDiscount(
    subtotal,
    currentCustomer,
    activeCouponCode
  );
  const amountAfterDiscount = Math.max(
    0,
    subtotal - discountBreakdown.totalDiscount
  );
  const tax = calculateTax(amountAfterDiscount);
  const payableAmount = calculateFinalAmount(
    subtotal,
    discountBreakdown.totalDiscount,
    tax
  );

  console.log(`Subtotal: ${formatCurrency(subtotal)}`);
  if (discountBreakdown.totalDiscount > 0) {
    console.log(`Total Discount: -${formatCurrency(discountBreakdown.totalDiscount)}`);
  }
  console.log(`GST (5%): ${formatCurrency(tax)}`);
  console.log(bold(green(`Total Payable Amount: ${formatCurrency(payableAmount)}`)));

  console.log("\nSelect Payment Method:");
  console.log("1. Cash");
  console.log("2. Card (Debit / Credit)");
  console.log("3. UPI (Google Pay, PhonePe, Paytm)");

  const paymentChoice = await prompt("Select payment option (1-3): ");
  let payment: Payment;

  if (paymentChoice === "1") {
    console.log(
      `Payable: ${formatCurrency(payableAmount)}. Please enter received cash.`
    );
    const cashStr = await prompt("Received Cash Amount (₹): ");
    const received = parseFloat(cashStr);

    if (isNaN(received) || received <= 0) {
      console.log(red("Invalid cash amount. Checkout cancelled."));
      return;
    }

    payment = createCashPayment(received);
  } else if (paymentChoice === "2") {
    const last4 = await prompt("Enter last 4 digits of your card: ");
    const holder = await prompt("Cardholder Name (optional): ");
    payment = createCardPayment(last4, holder.trim() || undefined);
  } else if (paymentChoice === "3") {
    const upiId = await prompt("Enter your UPI ID (e.g. user@okhdfcbank, optional): ");
    const txnId = await prompt("Enter UPI Transaction ID / Ref No: ");
    payment = createUpiPayment(txnId, upiId.trim() || undefined);
  } else {
    console.log(red("Invalid payment method selected. Checkout cancelled."));
    return;
  }

  const orderId = generateOrderId();
  // Generate bill returning discriminated union (BillSuccess | BillError)
  const billResult = generateBill(
    orderId,
    currentCustomer,
    currentCart,
    payment,
    activeCouponCode,
    "confirmed"
  );

  // Type narrowing on discriminated union status:
  if (billResult.status === "error") {
    console.log("\n" + formatBillOutput(billResult));
    return;
  }

  // BillSuccess: Print receipt and save to order history
  console.log("\n" + formatBillOutput(billResult));
  saveOrderToHistory(billResult);

  // Clear active cart and coupon after successful checkout
  currentCart = clearCart();
  activeCouponCode = undefined;
}

// 9. Change Order Status
async function handleChangeOrderStatus(): Promise<void> {
  console.log("\n" + bold("--- CHANGE ORDER STATUS ---"));
  const history = getOrderHistory();

  if (history.length === 0) {
    console.log(yellow("No past orders found to update. Place an order first!"));
    return;
  }

  console.log("Recent Orders:");
  history.forEach((order) => {
    console.log(
      ` - Order ID: ${bold(order.orderId)} | Date: ${order.createdAt} | Status: ${formatOrderStatus(
        order.orderStatus
      )} | Total: ${formatCurrency(order.finalAmount)}`
    );
  });

  const orderId = await prompt("\nEnter Order ID to change status: ");
  const targetOrder = findOrderById(orderId);

  if (!targetOrder) {
    console.log(red(`Order '${orderId}' not found.`));
    return;
  }

  console.log(
    `Current status of ${targetOrder.orderId}: ${formatOrderStatus(targetOrder.orderStatus)}`
  );

  if (
    targetOrder.orderStatus === "delivered" ||
    targetOrder.orderStatus === "cancelled"
  ) {
    console.log(
      yellow(`Cannot change status: Order is already in terminal state '${targetOrder.orderStatus}'.`)
    );
    return;
  }

  console.log("\nSelect New Status:");
  console.log("1. Confirmed");
  console.log("2. Preparing");
  console.log("3. Delivered");
  console.log("4. Cancelled");

  const statusChoice = await prompt("Select new status (1-4): ");
  let newStatus: OrderStatus | undefined = undefined;

  if (statusChoice === "1") newStatus = "confirmed";
  else if (statusChoice === "2") newStatus = "preparing";
  else if (statusChoice === "3") newStatus = "delivered";
  else if (statusChoice === "4") newStatus = "cancelled";

  if (!newStatus) {
    console.log(red("Invalid selection."));
    return;
  }

  try {
    const updated = updateHistoricalOrderStatus(targetOrder.orderId, newStatus);
    if (updated) {
      console.log(
        green(
          `Order ${targetOrder.orderId} status successfully updated to ${formatOrderStatus(
            newStatus
          )}!`
        )
      );
    } else {
      console.log(red("Failed to update status."));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    console.log(red(`Error updating status: ${message}`));
  }
}

// 10. View Order History
function handleViewOrderHistory(): void {
  console.log("\n" + bold("--- ORDER HISTORY ---"));
  const history = getOrderHistory();

  if (history.length === 0) {
    console.log(yellow("No past orders in this session."));
    return;
  }

  console.log("=".repeat(70));
  history.forEach((order, index) => {
    console.log(
      `#${index + 1} | Order ID: ${bold(order.orderId)} | Date: ${order.createdAt}`
    );
    console.log(`Customer: ${order.customer.name} | Status: ${formatOrderStatus(order.orderStatus)}`);
    console.log(
      `Items: ${order.cartItems.map((i) => `${i.name} (x${i.quantity})`).join(", ")}`
    );
    console.log(`Total: ${formatCurrency(order.finalAmount)} | Payment: ${order.payment.method.toUpperCase()}`);
    console.log("-".repeat(70));
  });
  console.log("=".repeat(70));
}

// Main interactive application loop
async function main(): Promise<void> {
  printHeader();

  let isRunning = true;

  while (isRunning) {
    printStatusSummary();
    console.log("\n" + bold("Main Menu:"));
    console.log(" 1. View Food Menu (with Search & Filter)");
    console.log(" 2. Manage Customer (Guest / Member)");
    console.log(" 3. Add Item to Cart");
    console.log(" 4. View Cart & Bill Preview");
    console.log(" 5. Update Item Quantity");
    console.log(" 6. Remove Item from Cart");
    console.log(" 7. Apply / Manage Coupon Codes");
    console.log(" 8. Checkout & Generate Final Bill");
    console.log(" 9. Change Order Status");
    console.log("10. View Order History");
    console.log("11. Exit");

    const inputChoice = await prompt(bold("\nEnter your choice (1-11): "));

    switch (inputChoice.trim()) {
      case "1":
        await handleViewMenu();
        break;
      case "2":
        await handleCustomerManagement();
        break;
      case "3":
        await handleAddToCart();
        break;
      case "4":
        handleViewCart();
        break;
      case "5":
        await handleUpdateQuantity();
        break;
      case "6":
        await handleRemoveItem();
        break;
      case "7":
        await handleCoupons();
        break;
      case "8":
        await handleCheckout();
        break;
      case "9":
        await handleChangeOrderStatus();
        break;
      case "10":
        handleViewOrderHistory();
        break;
      case "11":
        console.log("\n" + green("Thank you for using Food Ordering & Billing System! Goodbye.\n"));
        isRunning = false;
        break;
      default:
        console.log(red("Invalid choice! Please select an option between 1 and 11."));
        break;
    }

    if (isRunning) {
      console.log("\n");
    }
  }

  rl.close();
}

// Start application
main().catch((err: unknown) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error(red(`Fatal application error: ${errMsg}`));
  rl.close();
});
