import type { OrderStatus, BillSuccess } from "./types.ts";
import { assertNever, bold, green, red, yellow, cyan, magenta } from "./utils.ts";

// In-memory order history store
const orderHistory: BillSuccess[] = [];

// Formats order status with colored badges
export function formatOrderStatus(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return yellow("[PENDING]");
    case "confirmed":
      return cyan("[CONFIRMED]");
    case "preparing":
      return magenta("[PREPARING]");
    case "delivered":
      return green("[DELIVERED]");
    case "cancelled":
      return red("[CANCELLED]");
    default:
      return assertNever(status);
  }
}

// Checks if an order status can legally transition to the new status
export function isValidStatusTransition(
  current: OrderStatus,
  next: OrderStatus
): boolean {
  if (current === next) {
    return true;
  }
  if (current === "delivered" || current === "cancelled") {
    return false; // Terminal states cannot be changed
  }
  return true;
}

// Updates order status, validating through TypeScript types and exhaustiveness
export function updateOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): OrderStatus {
  // Exhaustive check to ensure all possible new statuses are handled
  switch (newStatus) {
    case "pending":
    case "confirmed":
    case "preparing":
    case "delivered":
    case "cancelled":
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new Error(
          `Cannot transition order status from '${currentStatus}' to '${newStatus}'.`
        );
      }
      return newStatus;

    default:
      // If a new status is added to OrderStatus union, TypeScript will trigger a compile error here
      return assertNever(newStatus);
  }
}

// Saves a successfully placed order to order history
export function saveOrderToHistory(order: BillSuccess): void {
  orderHistory.push(order);
}

// Returns a copy of all completed orders
export function getOrderHistory(): BillSuccess[] {
  return [...orderHistory];
}

// Finds an order in history by order ID
export function findOrderById(orderId: string): BillSuccess | undefined {
  return orderHistory.find((order: BillSuccess): boolean => {
    return order.orderId.toLowerCase() === orderId.trim().toLowerCase();
  });
}

// Updates status of an existing order in history
export function updateHistoricalOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): boolean {
  const orderIndex = orderHistory.findIndex(
    (o) => o.orderId.toLowerCase() === orderId.trim().toLowerCase()
  );

  if (orderIndex === -1) {
    return false;
  }

  const existingOrder = orderHistory[orderIndex];
  if (!existingOrder) {
    return false;
  }

  const updatedStatus = updateOrderStatus(existingOrder.orderStatus, newStatus);
  // Immutable update in array
  orderHistory[orderIndex] = {
    ...existingOrder,
    orderStatus: updatedStatus,
  };
  return true;
}
