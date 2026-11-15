// Quoting alone does not stop spreadsheets from executing untrusted formulas.
export const escapeCsvCell = (value) => {
  let text = String(value ?? "");
  const first = [...text].find((character) => character.trim() && character.charCodeAt(0) > 31);
  if (first && "=+@-".includes(first)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
