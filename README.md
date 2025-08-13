# AI-Assisted Logistics Cleanup & Reconciliation

This is a Node.js application that performs **order data cleanup**, **courier assignment planning**, and **delivery log reconciliation**.

## 📂 Project Structure
\`\`\`
project/
  ├── data/
  │   ├── orders.json
  │   ├── couriers.json
  │   ├── zones.csv
  │   ├── log.csv
  ├── scripts/
  │   ├── clean.js
  │   ├── plan.js
  │   ├── reconcile.js
  ├── index.js
  ├── package.json
  └── README.md
\`\`\`

## ⚙️ Requirements
- Node.js v20 or newer
- Dependencies:
  \`\`\`bash
  npm install csv-parser dayjs lodash string-similarity
  \`\`\`

## 🚀 How to Run
1. **Clean orders & generate \`clean_orders.json\`**
   \`\`\`bash
   npm run clean
   \`\`\`
   or
   \`\`\`bash
   node index.js clean
   \`\`\`

2. **Plan courier assignments & generate \`plan.json\`**
   \`\`\`bash
   npm run plan
   \`\`\`
   or
   \`\`\`bash
   node index.js plan
   \`\`\`

3. **Reconcile with the delivery log & generate \`reconciliation.json\`**
   \`\`\`bash
   npm run reconcile
   \`\`\`
   or
   \`\`\`bash
   node index.js reconcile
   \`\`\`

> **Note:** Run the commands in sequence (**clean → plan → reconcile**) because each step depends on the output of the previous one.

## 📄 Script Descriptions
- **clean.js**  
  Reads \`orders.json\`, normalizes fields (OrderId, city, zone, paymentType, productType, weight, deadline), handles duplicates, and generates a cleaned dataset \`clean_orders.json\`.

- **plan.js**  
  Reads \`clean_orders.json\` and \`couriers.json\` to assign each order to a suitable courier based on supported zones, payment type, product restrictions, and daily capacity.  
  Output includes:
  - \`assignments\`: Assigned orders with their courier IDs.
  - \`unassigned\`: Orders that couldn't be assigned, with reasons.
  - \`capacityUsage\`: Total assigned weight per courier.

- **reconcile.js**  
  Reads \`plan.json\` and \`log.csv\` to compare the planned assignments with actual deliveries.  
  Output includes:
  - \`missing\`: Orders in the plan but not delivered.
  - \`unexpected\`: Orders delivered but not in the plan.
  - \`duplicates\`: Orders duplicated in the log.
  - \`late\`: Orders delivered after their deadline.
  - \`misassigned\`: Orders delivered by the wrong courier.
  - \`overloadedCouriers\`: Couriers that exceeded their daily capacity.

## 🛠 Adjustments Made During Development
- Fixed reading \`zones.csv\` by using the correct column names: \`zone\` and \`canonical\`.
- Added checks to ensure \`zones\` and \`exclusions\` exist in \`couriers.json\` before use.
- Imported \`lodash\` in \`reconcile.js\` for counting duplicates.
- Improved error handling for missing or malformed data.
- Enforced sequential execution of steps to avoid missing intermediate files.

## 📌 Output Files
After running the scripts in order, you will have:
- \`data/clean_orders.json\`
- \`data/plan.json\`
- \`data/reconciliation.json\`

---

**Author:** Badr Shaban
