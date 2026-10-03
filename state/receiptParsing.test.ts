import assert from 'node:assert/strict';
import test from 'node:test';
import { parseReceiptAmount, parseReceiptDate } from './receiptParsing';

test('prefers the labelled total and does not parse date components as money', () => {
  assert.equal(parseReceiptAmount('Date: 2025-04-03\nItem £12.50\nTotal £12.50'), 12.5);
});

test('supports currency symbols and thousands separators', () => {
  assert.equal(parseReceiptAmount('Subtotal $1,200.00\nTax $90.00\nGrand Total $1,290.00'), 1290);
});

test('uses the final decimal amount when the receipt has no currency symbol', () => {
  assert.equal(parseReceiptAmount('Item 12.50\nTax 1.00\nTotal 13.50'), 13.5);
});

test('returns zero when no amount can be recognized', () => {
  assert.equal(parseReceiptAmount('2025-04-03'), 0);
  assert.equal(parseReceiptAmount('Invoice 120045'), 0);
  assert.equal(parseReceiptAmount('Total: 13'), 13);
});

test('parses UK receipt dates without local-time shifts and rejects missing or invalid dates', () => {
  assert.equal(parseReceiptDate('Date: 02/03/2025'), '2025-03-02');
  assert.equal(parseReceiptDate('Date: 03/25/2025'), '2025-03-25');
  assert.equal(parseReceiptDate('Date: 2025-02-30'), '');
  assert.equal(parseReceiptDate('No date printed'), '');
});
