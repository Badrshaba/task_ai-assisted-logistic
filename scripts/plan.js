import fs from 'fs';
import dayjs from 'dayjs';

const orders = JSON.parse(fs.readFileSync('./data/clean_orders.json'));
const couriers = JSON.parse(fs.readFileSync('./data/couriers.json'));

const assignments = [];
const unassigned = [];
const capacityUsage = couriers.map((c) => ({ courierId: c.courierId, totalWeight: 0 }));

function canAssign(order, courier) {
  if (!Array.isArray(courier.zones)) return false;

  const courierZones = courier.zones.map((z) => z.trim());

  if (!courierZones.includes(order.city)) return false;
  if (order.paymentType === 'COD' && !courier.acceptsCOD) return false;
  if (Array.isArray(courier.exclusions) && courier.exclusions.includes(order.productType)) return false;

  const usage = capacityUsage.find((c) => c.courierId === courier.courierId).totalWeight;
  if (usage + order.weight > courier.dailyCapacity) return false;

  return true;
}

orders.sort((a, b) => dayjs(a.deadline) - dayjs(b.deadline));

for (const order of orders) {
  const possible = couriers
    .filter((c) => canAssign(order, c))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const da = dayjs(order.deadline),
        db = dayjs(order.deadline);
      if (da.isBefore(db)) return -1;
      if (da.isAfter(db)) return 1;
      const wa = capacityUsage.find((c) => c.courierId === a.courierId).totalWeight;
      const wb = capacityUsage.find((c) => c.courierId === b.courierId).totalWeight;
      if (wa !== wb) return wa - wb;
      return a.courierId.localeCompare(b.courierId);
    });

  if (possible.length > 0) {
    const courier = possible[0];
    assignments.push({ orderId: order.orderId, courierId: courier.courierId });
    const usage = capacityUsage.find((c) => c.courierId === courier.courierId);
    usage.totalWeight += order.weight;
  } else {
    unassigned.push({ orderId: order.orderId, reason: 'no_supported_courier_or_capacity' });
  }
}

fs.writeFileSync('./data/plan.json', JSON.stringify({ assignments, unassigned, capacityUsage }, null, 2));
console.log('✅ plan.json generated');
