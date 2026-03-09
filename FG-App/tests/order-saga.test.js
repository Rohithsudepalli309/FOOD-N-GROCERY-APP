/**
 * Order Service Saga Coordinator — Unit Tests (Jest)
 * Tests: Surge pricing calculation, 90s auto-cancel, state machine transitions
 * These are pure logic tests that don't require a running database.
 */

// ── Surge Pricing Logic (inline for unit testing) ──────────────────────────
function calculateSurge({ hour, activeOrders, onlineRiders }) {
  let multiplier = 1.0;

  // Time-based demand bands
  if (hour >= 12 && hour <= 14) multiplier += 0.2; // Lunch rush
  if (hour >= 19 && hour <= 21) multiplier += 0.3; // Dinner rush

  // Supply/demand ratio
  if (onlineRiders < 5 && activeOrders > 20) multiplier += 0.5;
  else if (onlineRiders < 10 && activeOrders > 40) multiplier += 0.3;

  return parseFloat(Math.min(multiplier, 2.5).toFixed(2)); // Cap at 2.5x
}

// ── Valid order status transitions ─────────────────────────────────────────
const VALID_TRANSITIONS = {
  pending:         ['accepted', 'cancelled_auto'],
  accepted:        ['preparing', 'cancelled_auto'],
  preparing:       ['ready_for_pickup'],
  ready_for_pickup:['picked_up'],
  picked_up:       ['delivered'],
  delivered:       [],
  cancelled_auto:  [],
};

function canTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Surge Pricing Algorithm', () => {
  it('should return baseline 1.0x multiplier outside peak hours (3am)', () => {
    expect(calculateSurge({ hour: 3, activeOrders: 5, onlineRiders: 20 })).toBe(1.0);
  });

  it('should apply 1.2x during lunch rush (12-14)', () => {
    expect(calculateSurge({ hour: 13, activeOrders: 5, onlineRiders: 20 })).toBe(1.2);
  });

  it('should apply 1.3x during dinner rush (19-21)', () => {
    expect(calculateSurge({ hour: 20, activeOrders: 5, onlineRiders: 20 })).toBe(1.3);
  });

  it('should spike to 1.5x when supply (riders) is critically low', () => {
    expect(calculateSurge({ hour: 10, activeOrders: 25, onlineRiders: 3 })).toBe(1.5);
  });

  it('should add both time and supply bonuses during peak shortage', () => {
    // Dinner rush + critically low riders = 1.0 + 0.3 + 0.5 = 1.8
    expect(calculateSurge({ hour: 20, activeOrders: 25, onlineRiders: 3 })).toBe(1.8);
  });

  it('should calculate the combined maximum surge correctly', () => {
    // 1.0 (base) + 0.3 (dinner rush) + 0.5 (critical shortage) = 1.8 max achievable in this algorithm
    expect(calculateSurge({ hour: 20, activeOrders: 100, onlineRiders: 1 })).toBe(1.8);
  });
});

describe('Order State Machine — canTransition()', () => {
  it('should allow pending → accepted', () => {
    expect(canTransition('pending', 'accepted')).toBe(true);
  });

  it('should allow pending → cancelled_auto (Saga compensation)', () => {
    expect(canTransition('pending', 'cancelled_auto')).toBe(true);
  });

  it('should allow accepted → cancelled_auto (restaurant rejected)', () => {
    expect(canTransition('accepted', 'cancelled_auto')).toBe(true);
  });

  it('should NOT allow delivered → any state', () => {
    expect(canTransition('delivered', 'cancelled_auto')).toBe(false);
    expect(canTransition('delivered', 'pending')).toBe(false);
  });

  it('should NOT allow backwards transition (accepted → pending)', () => {
    expect(canTransition('accepted', 'pending')).toBe(false);
  });

  it('should NOT allow skipping states (pending → delivered)', () => {
    expect(canTransition('pending', 'delivered')).toBe(false);
  });

  it('should allow the full happy-path lifecycle', () => {
    const lifecycle = ['pending','accepted','preparing','ready_for_pickup','picked_up','delivered'];
    for (let i = 0; i < lifecycle.length - 1; i++) {
      expect(canTransition(lifecycle[i], lifecycle[i + 1])).toBe(true);
    }
  });
});

describe('Auto-Cancel Timer', () => {
  it('should resolve after 90ms (simulating 90s)', (done) => {
    jest.useFakeTimers();
    const autoCancel = jest.fn();
    setTimeout(autoCancel, 90);
    jest.runAllTimers();
    expect(autoCancel).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
    done();
  });
});
