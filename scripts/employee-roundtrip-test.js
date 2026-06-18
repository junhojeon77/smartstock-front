/**
 * Employee → DB → UI roundtrip smoke test
 *
 * Validates that the live backend returns a well-formed inventory array
 * and prints the browser snippet needed to simulate an Employee session.
 *
 * Run: node scripts/employee-roundtrip-test.js
 */

const API_BASE = "https://smartstock-back-hr9z.onrender.com";
const ENDPOINT = `${API_BASE}/api/inventory`;

const REQUIRED_FIELDS = ["item_id", "item_name", "category", "quantity"];

function pass(msg) {
  console.log(`  ✅ PASS  ${msg}`);
}

function fail(msg) {
  console.error(`  ❌ FAIL  ${msg}`);
  process.exitCode = 1;
}

async function run() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  Smart Stock — Employee → DB → UI Roundtrip Test");
  console.log("══════════════════════════════════════════════════════");
  console.log(`\n  Target: ${ENDPOINT}\n`);

  // ── 1. HTTP request ────────────────────────────────────────────────────────
  let res;
  try {
    res = await fetch(ENDPOINT);
  } catch (err) {
    fail(`Network error — is the backend awake? (${err.message})`);
    console.log("\n  Tip: Render free-tier spins down after inactivity.");
    console.log("  Wait ~30 s then retry.\n");
    return;
  }

  // ── 2. Status 200 ─────────────────────────────────────────────────────────
  if (res.status === 200) {
    pass(`GET /api/inventory returned HTTP 200`);
  } else {
    fail(`Expected HTTP 200, got ${res.status}`);
    return;
  }

  // ── 3. JSON parse ─────────────────────────────────────────────────────────
  let data;
  try {
    data = await res.json();
  } catch {
    fail("Response body is not valid JSON");
    return;
  }

  // ── 4. Array check ────────────────────────────────────────────────────────
  if (Array.isArray(data)) {
    pass("Response is an array");
  } else {
    fail(`Expected array, got ${typeof data}`);
    return;
  }

  // ── 5. At least one item ──────────────────────────────────────────────────
  if (data.length > 0) {
    pass(`Array contains ${data.length} inventory item(s)`);
  } else {
    fail("Array is empty — run seed.py on the backend first");
    return;
  }

  // ── 6. Required fields on every item ─────────────────────────────────────
  let allFieldsOk = true;
  for (const item of data) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in item)) {
        fail(`Item missing required field "${field}": ${JSON.stringify(item)}`);
        allFieldsOk = false;
      }
    }
  }
  if (allFieldsOk) {
    pass(`All items have required fields: ${REQUIRED_FIELDS.join(", ")}`);
  }

  // ── 7. Sample item preview ────────────────────────────────────────────────
  const sample = data[0];
  console.log("\n  Sample item from DB:");
  console.log(`    item_id   : ${sample.item_id}`);
  console.log(`    item_name : ${sample.item_name}`);
  console.log(`    category  : ${sample.category}`);
  console.log(`    quantity  : ${sample.quantity}`);
  if (sample.minimum_threshold != null) {
    console.log(`    min_thresh: ${sample.minimum_threshold}`);
  }
  if (sample.expiry_date != null) {
    console.log(`    expiry    : ${String(sample.expiry_date).slice(0, 10)}`);
  }

  // ── 8. Browser console snippet ────────────────────────────────────────────
  console.log(`
──────────────────────────────────────────────────────
  BROWSER CONSOLE — simulate Employee session
──────────────────────────────────────────────────────

  Open http://localhost:3000, then paste this in DevTools console:

  localStorage.setItem("smartstock_token", "employee-demo-token");
  localStorage.setItem("smartstock_user", JSON.stringify({
    user_id: 3,
    name: "Employee Demo",
    email: "employee@smartstock.com",
    role: "Employee"
  }));
  location.href = "/inventory";
`);

  // ── 9. Expected UI result ─────────────────────────────────────────────────
  console.log(`──────────────────────────────────────────────────────
  EXPECTED UI RESULT at /inventory
──────────────────────────────────────────────────────

  ✔ Inventory table loads live data from GET /api/inventory
  ✔ "Add Item" button → hidden  (Employee cannot add)
  ✔ Edit (✏) button   → hidden  (Employee cannot edit)
  ✔ Delete (🗑) button → hidden  (Employee cannot delete)
  ✔ Actions column    → shows "View only" label
  ✔ Search bar        → visible and functional
  ✔ Table rows        → ${data.length} item(s) from live DB
`);

  const exitCode = process.exitCode ?? 0;
  if (exitCode === 0) {
    console.log("══════════════════════════════════════════════════════");
    console.log("  ALL CHECKS PASSED — Week 4 Employee roundtrip OK");
    console.log("══════════════════════════════════════════════════════\n");
  } else {
    console.log("══════════════════════════════════════════════════════");
    console.log("  SOME CHECKS FAILED — see ❌ lines above");
    console.log("══════════════════════════════════════════════════════\n");
  }
}

run();
