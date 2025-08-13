import fs from 'fs';
import csv from 'csv-parser';
import _ from 'lodash';
import stringSimilarity from 'string-similarity';
import dayjs from 'dayjs';

const orders = JSON.parse(fs.readFileSync('./data/orders.json'));
const zones = {};
const warnings = [];

async function loadZones() {
  return new Promise((resolve) => {
    fs.createReadStream('./data/zones.csv')
      .pipe(csv())
      .on('data', (row) => {
        const raw = row.zone.trim().toLowerCase();
        zones[raw] = row.canonical.trim();
      })
      .on('end', resolve);
  });
}

function normalizeOrderId(id) {
  return id
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\-]/g, '');
}

function normalizeZone(zoneHint) {
  if (!zoneHint) return null;
  const hint = zoneHint.trim().toLowerCase();
  if (zones[hint]) return zones[hint];
  // fuzzy match
  const match = stringSimilarity.findBestMatch(hint, Object.keys(zones));
  return zones[match.bestMatch.target] || zoneHint;
}

function normalizePaymentType(type) {
  const val = type.trim().toLowerCase();
  if (val.includes('cod')) return 'COD';
  return 'Prepaid';
}

function normalizeProductType(type) {
  return type.trim().toLowerCase();
}

function normalizeWeight(weight) {
  const num = parseFloat(weight);
  return isNaN(num) ? 0 : num;
}

function normalizeDate(date) {
  const parsed = dayjs(date, ['YYYY-MM-DD HH:mm', 'YYYY/MM/DD HH:mm'], true);
  return parsed.isValid() ? parsed.toISOString() : null;
}

function cleanOrders(data) {
  const map = {};

  for (const order of data) {
    const id = normalizeOrderId(order.orderId);
    const city = normalizeZone(order.city || order.zoneHint);
    const paymentType = normalizePaymentType(order.paymentType);
    const productType = normalizeProductType(order.productType);
    const weight = normalizeWeight(order.weight);
    const deadline = normalizeDate(order.deadline);

    if (!map[id]) {
      map[id] = { orderId: id, city, paymentType, productType, weight, deadline };
    } else {
      // merge duplicates
      const existing = map[id];
      if (!existing.city && city) existing.city = city;
      if (!existing.paymentType && paymentType) existing.paymentType = paymentType;
      if (!existing.productType && productType) existing.productType = productType;
      if (!existing.weight && weight) existing.weight = weight;
      if (!existing.deadline && deadline) existing.deadline = deadline;

      if (existing.deadline && deadline && dayjs(deadline).isBefore(existing.deadline)) {
        existing.deadline = deadline;
      }
    }
  }

  return Object.values(map);
}

(async function () {
  await loadZones();
  const cleaned = cleanOrders(orders);
  fs.writeFileSync('./data/clean_orders.json', JSON.stringify(cleaned, null, 2));
  console.log('✅ clean_orders.json generated');
})();
