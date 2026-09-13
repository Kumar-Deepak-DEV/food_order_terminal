import type { FoodItem, Coupon } from "./types.ts";

// Initial Food Menu (at least 8 items across all 4 categories)
export const initialFoodItems: FoodItem[] = [
  {
    id: 1,
    name: "Margherita Pizza",
    category: "pizza",
    price: 299,
    isAvailable: true,
  },
  {
    id: 2,
    name: "Farmhouse Veggie Pizza",
    category: "pizza",
    price: 449,
    isAvailable: true,
  },
  {
    id: 3,
    name: "Paneer Tikka Stuffed Pizza",
    category: "pizza",
    price: 499,
    isAvailable: true,
  },
  {
    id: 4,
    name: "Classic Veg Burger",
    category: "burger",
    price: 149,
    isAvailable: true,
  },
  {
    id: 5,
    name: "Crispy Paneer Burger",
    category: "burger",
    price: 199,
    isAvailable: true,
  },
  {
    id: 6,
    name: "Cold Brew Coffee",
    category: "drink",
    price: 179,
    isAvailable: true,
  },
  {
    id: 7,
    name: "Fresh Mint Mojito",
    category: "drink",
    price: 129,
    isAvailable: true,
  },
  {
    id: 8,
    name: "Mango Thick Shake",
    category: "drink",
    price: 159,
    isAvailable: true,
  },
  {
    id: 9,
    name: "Chocolate Lava Cake",
    category: "dessert",
    price: 189,
    isAvailable: true,
  },
  {
    id: 10,
    name: "Belgian Waffle with Ice Cream",
    category: "dessert",
    price: 249,
    isAvailable: true,
  },
];

// Available discount coupons
export const availableCoupons: Coupon[] = [
  {
    code: "WELCOME50",
    description: "Flat ₹50 off on orders above ₹300",
    discountType: "flat",
    value: 50,
    minSubtotal: 300,
  },
  {
    code: "FOODIE10",
    description: "10% off on orders above ₹500",
    discountType: "percentage",
    value: 10,
    minSubtotal: 500,
  },
  {
    code: "FEAST20",
    description: "20% off on orders above ₹1500",
    discountType: "percentage",
    value: 20,
    minSubtotal: 1500,
  },
];
