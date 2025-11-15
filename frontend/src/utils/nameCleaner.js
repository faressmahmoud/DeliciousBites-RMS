// src/utils/nameCleaner.js
export function cleanMenuItemName(name) {
  if (!name) return '';

  // Force string
  const str = String(name);

  // ✅ HARD FIX: remove ALL digits anywhere in the name
  // "Crispy French Fries0"   -> "Crispy French Fries"
  // "Beef Tenderloin10"      -> "Beef Tenderloin"
  // "Pizza 4Cheese 2025"     -> "Pizza Cheese "
  const noDigits = str.replace(/[0-9]/g, '');

  // Remove extra spaces & quotes
  return noDigits.trim().replace(/^['"]+|['"]+$/g, '');
}
