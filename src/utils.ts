// Exhaustiveness checking function
export function assertNever(value: never): never {
  throw new Error(`Unhandled exhaustive case: ${JSON.stringify(value)}`);
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

// ANSI Escape Code Styling for terminal output
export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // Background colors
  bgGreen: "\x1b[42m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

// Styling helpers
export function bold(text: string): string {
  return `${colors.bold}${text}${colors.reset}`;
}

export function green(text: string): string {
  return `${colors.green}${text}${colors.reset}`;
}

export function yellow(text: string): string {
  return `${colors.yellow}${text}${colors.reset}`;
}

export function red(text: string): string {
  return `${colors.red}${text}${colors.reset}`;
}

export function cyan(text: string): string {
  return `${colors.cyan}${text}${colors.reset}`;
}

export function magenta(text: string): string {
  return `${colors.magenta}${text}${colors.reset}`;
}

export function gray(text: string): string {
  return `${colors.gray}${text}${colors.reset}`;
}

// Pads string to fixed width for clean table columns
export function pad(text: string, width: number, align: "left" | "right" = "left"): string {
  const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, "").length;
  const paddingNeeded = Math.max(0, width - visibleLength);
  const padding = " ".repeat(paddingNeeded);
  return align === "left" ? `${text}${padding}` : `${padding}${text}`;
}

// Generates a short unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  return `ORD-${timestamp}-${randomPart}`;
}
