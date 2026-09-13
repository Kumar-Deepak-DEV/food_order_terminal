import type { CartItem, FoodItem, ID } from "./types.ts";

// Calculates total for a single cart item (price * quantity)
export function calculateItemTotal(item: CartItem): number {
  return item.price * item.quantity;
}

// Calculates the subtotal of all items in the cart using reduce()
export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((total: number, item: CartItem): number => {
    return total + calculateItemTotal(item);
  }, 0);
}

// Adds an item to the cart or increases its quantity if it already exists
export function addToCart(
  cart: CartItem[],
  item: FoodItem,
  quantity: number,
  specialInstruction?: string
): CartItem[] {
  if (quantity <= 0) {
    return cart;
  }

  // Using findIndex to check if item is already in cart
  const existingItemIndex = cart.findIndex((cartItem: CartItem): boolean => {
    return cartItem.id === item.id;
  });

  if (existingItemIndex !== -1) {
    // Return updated cart with new quantity using map()
    return cart.map((cartItem: CartItem, index: number): CartItem => {
      if (index === existingItemIndex) {
        const updatedInstruction =
          specialInstruction !== undefined && specialInstruction.trim().length > 0
            ? specialInstruction
            : cartItem.specialInstruction;

        return {
          ...cartItem,
          quantity: cartItem.quantity + quantity,
          specialInstruction: updatedInstruction,
        };
      }
      return cartItem;
    });
  }

  // New item: intersection of FoodItem and OrderItemDetails
  const newCartItem: CartItem = {
    ...item,
    quantity,
    specialInstruction:
      specialInstruction !== undefined && specialInstruction.trim().length > 0
        ? specialInstruction
        : undefined,
  };

  return [...cart, newCartItem];
}

// Updates quantity of an item in the cart. If quantity <= 0, item is removed.
export function updateQuantity(
  cart: CartItem[],
  itemId: ID,
  newQuantity: number
): CartItem[] {
  if (newQuantity <= 0) {
    return removeFromCart(cart, itemId);
  }

  return cart.map((item: CartItem): CartItem => {
    if (item.id === itemId) {
      return {
        ...item,
        quantity: newQuantity,
      };
    }
    return item;
  });
}

// Removes an item from the cart using filter()
export function removeFromCart(cart: CartItem[], itemId: ID): CartItem[] {
  return cart.filter((item: CartItem): boolean => {
    return item.id !== itemId;
  });
}

// Checks if an item ID exists in the cart using some()
export function isItemInCart(cart: CartItem[], itemId: ID): boolean {
  return cart.some((item: CartItem): boolean => item.id === itemId);
}

// Clears the cart
export function clearCart(): CartItem[] {
  return [];
}
