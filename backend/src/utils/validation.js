const isText = (value, max) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  [...value.trim()].length <= max;
const validEmail = (value) =>
  isText(value, 150) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const validPassword = (value) =>
  typeof value === "string" &&
  value.length >= 8 &&
  value.trim().length > 0 &&
  Buffer.byteLength(value, "utf8") <= 72;
const isNumeric = (value) =>
  (typeof value === "number" || typeof value === "string") &&
  String(value).trim() !== "" &&
  Number.isFinite(Number(value));
const validCount = (value) =>
  isNumeric(value) &&
  Number.isInteger(Number(value)) &&
  Number(value) >= 0 &&
  Number(value) <= 4294967295;
const validId = (value) =>
  isNumeric(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
const validMoney = (value) =>
  isNumeric(value) &&
  Number(value) >= 0 &&
  Number(value) <= 9999999999999.99 &&
  /^\d+(?:\.\d{1,2})?$/.test(String(value).trim());
const optionalText = (value, max) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" &&
    [...value].length <= max &&
    Buffer.byteLength(value, "utf8") <= 65535);
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number(value.slice(0, 4)) >= 1000 &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

module.exports = {
  isText,
  validEmail,
  validPassword,
  validId,
  validCount,
  validMoney,
  optionalText,
  validDate,
};
