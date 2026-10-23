import { describe, expect, it } from 'vitest';
import {
  attributeSummary,
  canCancelOrder,
  orderTotal,
  paymentOptions,
  shippingAmountFor,
  totalsMatch,
} from './checkout.rules.js';

describe('checkout rules', () => {
  it('adds server shipping to the subtotal', () => {
    expect(orderTotal(129, 0)).toBe('129.00');
    expect(orderTotal(10.5, 0)).toBe('10.50');
  });

  it('rejects a client total that no longer matches', () => {
    expect(totalsMatch('129.00', '129.00')).toBe(true);
    expect(totalsMatch(129, '129.00')).toBe(true);
    expect(totalsMatch('140.00', '129.00')).toBe(false);
    expect(totalsMatch('nope', '129.00')).toBe(false);
    expect(totalsMatch(undefined, '129.00')).toBe(true);
  });

  it('offers cash on delivery and keeps online payment unavailable', () => {
    const methods = paymentOptions();
    expect(methods.find((method) => method.id === 'cod')?.available).toBe(true);
    expect(methods.find((method) => method.id === 'online')?.available).toBe(
      false,
    );
  });

  it('prices only the standard delivery method', () => {
    expect(shippingAmountFor('standard')).toBe(0);
    expect(shippingAmountFor('express')).toBeNull();
  });

  it('allows cancellation only before shipment', () => {
    expect(canCancelOrder('CONFIRMED')).toBe(true);
    expect(canCancelOrder('PROCESSING')).toBe(true);
    expect(canCancelOrder('SHIPPED')).toBe(false);
    expect(canCancelOrder('FULFILLED')).toBe(false);
    expect(canCancelOrder('CANCELLED')).toBe(false);
  });

  it('summarizes variant attributes', () => {
    expect(attributeSummary({ size: '8' })).toBe('Size: 8');
    expect(attributeSummary(null)).toBeNull();
    expect(attributeSummary(['8'])).toBeNull();
  });
});
