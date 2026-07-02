const WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1
};

export function calculatePriority(n) {
  const weight = WEIGHTS[n.Type] || 0;
  const time = new Date(n.Timestamp).getTime() || 0;

  return weight * 1e12 + time;
}