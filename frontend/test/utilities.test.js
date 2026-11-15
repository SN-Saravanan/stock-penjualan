import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell } from "../src/utils/csv.js";
import { formatDate, formatDateTime, formatRupiah } from "../src/utils/formatters.js";
import { toastPromise, toast } from "../src/utils/toast.js";

test("CSV preserves commas, quotes and newlines", () => {
  assert.equal(escapeCsvCell('A,"B"\nC'), '"A,""B""\nC"');
  assert.equal(escapeCsvCell(null), '""');
});
for (const value of ["=1+1", "+SUM(A1)", "@SUM(A1)", "-1+1", "\t=1+1", " \r=1+1"]) {
  test(`CSV neutralizes formula prefix ${JSON.stringify(value)}`, () => assert.ok(escapeCsvCell(value).startsWith('"\'')));
}
test("date formatting tolerates missing or invalid data", () => {
  for (const value of [null, undefined, "not-a-date"]) {
    assert.equal(formatDate(value), "-"); assert.equal(formatDateTime(value), "-");
  }
  assert.match(formatDate("2026-11-15T00:00:00"), /2026/);
  assert.ok(formatRupiah(0).includes("0"));
  assert.match(formatRupiah(12.35), /12,35/);
});
test("toast helper awaits request completion and returns the API response", async () => {
  let resolve;
  const request = new Promise((done) => { resolve = done; });
  const result = toastPromise(request, { loading: "Loading", success: "Saved", error: "Failed" });
  assert.equal(result, request);
  let finished = false;
  result.then(() => { finished = true; });
  await Promise.resolve(); assert.equal(finished, false);
  resolve({ data: { id: 42 } });
  assert.deepEqual(await result, { data: { id: 42 } });
  toast.dismiss();
});
test("toast helper propagates API failures to the caller", async () => {
  await assert.rejects(toastPromise(Promise.reject(new Error("API failed")), {
    loading: "Loading", success: "Saved", error: (error) => error.message,
  }), /API failed/);
  toast.dismiss();
});
