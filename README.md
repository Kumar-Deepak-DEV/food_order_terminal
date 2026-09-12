# Food Ordering & Billing System — Terminal Application

A robust, fully-typed **terminal-based Food Ordering & Billing System** built with **TypeScript** and **Node.js (v22+ native TypeScript execution)**.

---

## Quick Start

### 1. Run the Terminal Application
```bash
npm start
# or directly:
node src/index.ts
```

### 2. Run Comprehensive Test Suite
```bash
npm test
```

### 3. Verify TypeScript Types
```bash
npm run typecheck
```

---

## Project Structure

```text
assign/
├── src/
│   ├── types.ts       # Type aliases, interfaces, unions, intersections, discriminated unions
│   ├── data.ts        # Initial menu items (10 items) and discount coupons
│   ├── customer.ts    # Guest and Member customer factory functions, 'in' type guards
│   ├── cart.ts        # Cart operations (add, remove, update quantity, item total, subtotal)
│   ├── payment.ts     # Cash, Card, UPI payment creation, processing, and type narrowing
│   ├── billing.ts     # Discount rules, GST calculation, final amount, bill generation
│   ├── order.ts       # Order status transitions, assertNever exhaustiveness, order history
│   ├── utils.ts       # Exhaustive assertNever helper, currency & ANSI terminal styling
│   └── index.ts       # Interactive terminal CLI with readline/promises
├── test_runner.ts     # Automated assertion test suite covering 100% of requirements
├── package.json       # ESM package configuration and scripts
├── tsconfig.json      # Strict TypeScript compiler options
└── README.md          # Documentation and submission checklist
```

---

## Key Requirements & Implementation Details

### 1. Food Items (`src/data.ts` & `src/types.ts`)
- `FoodCategory`: `"pizza" | "burger" | "drink" | "dessert"`
- `FoodItem` interface: `id`, `name`, `category`, `price`, `isAvailable`
- 10 diverse items across all four categories.

### 2. Customer (`src/customer.ts` & `src/types.ts`)
- `Guest`: Base info (`id`, `name`, optional `phone`, `address`)
- `Member`: Additionally contains `membershipId`, `discountPercentage`, and `membershipLevel` (`"silver" | "gold" | "platinum"`)
- Union Type: `type Customer = Guest | Member`
- Type Narrowing: Handled using `isMember(customer)` powered by the `'membershipId' in customer` check.

### 3. Cart & Intersection Types (`src/cart.ts` & `src/types.ts`)
- `type CartItem = FoodItem & OrderItemDetails`
- Combines food item details with `quantity` and optional `specialInstruction`.
- Pure functions: `addToCart`, `updateQuantity`, `removeFromCart`, `calculateItemTotal`, `calculateSubtotal`.

### 4. Order Status (`src/order.ts` & `src/types.ts`)
- `OrderStatus`: `"pending" | "confirmed" | "preparing" | "delivered" | "cancelled"`
- Status transitions are validated (e.g. delivered/cancelled cannot be transitioned).
- Invalid statuses are impossible through TypeScript literal types.

### 5. Payment & Type Narrowing (`src/payment.ts` & `src/types.ts`)
- Union Type: `type Payment = CashPayment | CardPayment | UpiPayment`
  - `CashPayment`: `receivedAmount`
  - `CardPayment`: `last4Digits` (must be 4 numeric digits)
  - `UpiPayment`: `transactionId`
- `processPayment` narrows the union using:
  - Discriminator equality check (`payment.method === "cash"`, etc.)
  - Property checking via `in` (`"receivedAmount" in payment`)
  - Runtime type checking via `typeof`
  - Exhaustive check via `assertNever` in default case.

### 6. Discount Rules (`src/billing.ts`)
- **Membership Discounts**:
  - Guest: `0%`
  - Silver: `5%`
  - Gold: `10%`
  - Platinum: `15%`
- **Volume Discount**:
  - Subtotal > ₹2000 gets an additional `5%` discount.
- All discounts are calculated **before GST**.

### 7. GST Calculation (`src/billing.ts`)
- Calculated as `5% GST` on the amount after all applicable discounts.
- Formula: `GST = (Subtotal - TotalDiscount) * 0.05`

### 8. Discriminated Union for Bill Result (`src/types.ts` & `src/billing.ts`)
```ts
export type BillResult = BillSuccess | BillError;
```
- `BillSuccess`: `{ status: "success", orderId, customer, cartItems, subtotal, discountBreakdown, tax, finalAmount, payment, orderStatus, createdAt }`
- `BillError`: `{ status: "error", message: string }`
- Calling code narrows safely on `billResult.status`.

### 9. Exhaustiveness Checking (`src/utils.ts`)
```ts
export function assertNever(value: never): never {
  throw new Error(`Unhandled exhaustive case: ${JSON.stringify(value)}`);
}
```
- Used in order status transitions and payment processing to guarantee compile-time safety.

### 10. Additional Bonus Features
1. **Discount Coupons**: Supported coupon codes like `WELCOME50` (flat ₹50 off), `FOODIE10` (10% off), and `FEAST20` (20% off).
2. **Food Search & Filtering**: Filter menu by category (`pizza`, `burger`, `drink`, `dessert`) or search by name.
3. **Order History**: Stores placed orders in memory; view past receipts and update status across order lifecycles.

---

## Strict Constraints Followed

- [x] **Zero `any`**: No use of `any` anywhere in the codebase.
- [x] **Zero Classes**: Pure functional programming and object contracts.
- [x] **Zero Generics**: No `<T>` type parameters used anywhere.
- [x] **Multi-file Modular Architecture**: Code organized into logical, single-responsibility files.
- [x] **Terminal UI**: Completely runs in the terminal using Node's native `readline/promises`.

---

## Submission Checklist

- [x] Application runs successfully from the terminal
- [x] At least 8 food items exist (10 provided)
- [x] Guest and Member customers work
- [x] Cart add/update/remove works
- [x] Subtotal is calculated correctly
- [x] Membership discount works (0%, 5%, 10%, 15%)
- [x] Additional ₹2000 discount works (extra 5%)
- [x] GST is calculated correctly (5% after discount)
- [x] Cash/Card/UPI payments work with type narrowing
- [x] Order status can be changed
- [x] `BillResult` uses a discriminated union (`success` | `error`)
- [x] Type narrowing is used (`in`, `typeof`, equality checks)
- [x] `never` is used for exhaustive checking (`assertNever`)
- [x] No `any`
- [x] No classes
- [x] Functions have proper types and explicit return types
- [x] Reusable type aliases/interfaces are used
- [x] Code is split into logical functions/files
- [x] At least one additional feature is implemented (Coupons, Menu Search/Filter, Order History)
