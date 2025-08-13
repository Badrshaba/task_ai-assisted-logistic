import fs from 'fs';
import csv from 'csv-parser';
import dayjs from 'dayjs';
import _ from 'lodash';

const plan = JSON.parse(fs.readFileSync('./data/plan.json'));
const cleanOrders = JSON.parse(fs.readFileSync('./data/clean_orders.json'));

const logData = [];
fs.createReadStream('./data/log.csv')
  .pipe(csv())
  .on('data', (row) => logData.push(row))
  .on('end', () => {
    const cleanIds = cleanOrders.map((o) => o.orderId);
    const planMap = Object.fromEntries(plan.assignments.map((a) => [a.orderId, a.courierId]));

    const missing = plan.assignments
      .filter((a) => !logData.find((l) => l.orderId === a.orderId))
      .map((a) => a.orderId)
      .sort();

    const unexpected = logData
      .filter((l) => !cleanIds.includes(l.orderId))
      .map((l) => l.orderId)
      .sort();

    const duplicates = Object.entries(_.countBy(logData, 'orderId'))
      .filter(([id, count]) => count > 1)
      .map(([id]) => id)
      .sort();

    const late = logData
      .filter((l) => {
        const order = cleanOrders.find((o) => o.orderId === l.orderId);
        return order && dayjs(l.deliveredAt).isAfter(order.deadline);
      })
      .map((l) => l.orderId)
      .sort();

    const misassigned = logData
      .filter((l) => planMap[l.orderId] && planMap[l.orderId] !== l.deliveredBy)
      .map((l) => l.orderId)
      .sort();

    const overloadedCouriers = [];
    const actualWeights = {};
    logData.forEach((l) => {
      const order = cleanOrders.find((o) => o.orderId === l.orderId);
      if (!order) return;
      actualWeights[l.deliveredBy] = (actualWeights[l.deliveredBy] || 0) + order.weight;
    });

    plan.capacityUsage.forEach((c) => {
      if (actualWeights[c.courierId] > c.totalWeight) {
        overloadedCouriers.push(c.courierId);
      }
    });

    const result = { missing, unexpected, duplicates, late, misassigned, overloadedCouriers };
    fs.writeFileSync('./data/reconciliation.json', JSON.stringify(result, null, 2));
    console.log('✅ reconciliation.json generated');
  });
