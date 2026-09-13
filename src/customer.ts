import type {
  Customer,
  Guest,
  Member,
  MembershipLevel,
  Address,
  ID,
} from "./types.ts";
import { bold, cyan, yellow, green } from "./utils.ts";

// Helper to determine discount percentage from membership level
export function getDiscountPercentageForLevel(level: MembershipLevel): number {
  switch (level) {
    case "silver":
      return 5;
    case "gold":
      return 10;
    case "platinum":
      return 15;
  }
}

// Factory function for Guest customer
export function createGuest(
  id: ID,
  name: string,
  address: Address,
  phone?: string
): Guest {
  return {
    id,
    name,
    phone,
    address,
  };
}

// Factory function for Member customer
export function createMember(
  id: ID,
  name: string,
  address: Address,
  level: MembershipLevel,
  phone?: string
): Member {
  const discountPercentage = getDiscountPercentageForLevel(level);
  const membershipId = `MEM-${level.toUpperCase()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  return {
    id,
    name,
    phone,
    address,
    membershipId,
    discountPercentage,
    membershipLevel: level,
  };
}

// Type guard using the 'in' operator to narrow Customer to Member
export function isMember(customer: Customer): customer is Member {
  return "membershipId" in customer && "membershipLevel" in customer;
}

// Returns the customer's membership discount percentage
export function getCustomerDiscountRate(customer: Customer): number {
  // Using type narrowing with 'in' operator
  if (isMember(customer)) {
    return customer.discountPercentage;
  }
  return 0;
}

// Formats customer details for display
export function formatCustomerDetails(customer: Customer): string {
  const phoneText = customer.phone ?? "Not provided";
  const addressText = `${customer.address.street}, ${customer.address.city} - ${customer.address.pincode}`;

  // Type narrowing with 'in'
  if (isMember(customer)) {
    const levelColor =
      customer.membershipLevel === "platinum"
        ? cyan(customer.membershipLevel.toUpperCase())
        : customer.membershipLevel === "gold"
        ? yellow(customer.membershipLevel.toUpperCase())
        : bold(customer.membershipLevel.toUpperCase());

    return [
      `Customer: ${bold(customer.name)} (${green("Member")})`,
      `Membership ID: ${customer.membershipId} | Tier: ${levelColor} (${customer.discountPercentage}% off)`,
      `Phone: ${phoneText}`,
      `Address: ${addressText}`,
    ].join("\n");
  }

  return [
    `Customer: ${bold(customer.name)} (Guest)`,
    `Phone: ${phoneText}`,
    `Address: ${addressText}`,
  ].join("\n");
}
