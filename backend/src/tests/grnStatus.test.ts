
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GRN_STATUS,
  canChangeGRNStatus
} from '../constants/grnStatus';

test('Draft GRN can be submitted for verification', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.DRAFT,
      GRN_STATUS.PENDING_VERIFICATION
    ),
    true
  );
});

test('Pending GRN can request changes', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.PENDING_VERIFICATION,
      GRN_STATUS.CHANGES_REQUESTED
    ),
    true
  );
});

test('Changes requested GRN can be resubmitted', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.CHANGES_REQUESTED,
      GRN_STATUS.PENDING_VERIFICATION
    ),
    true
  );
});

test('Pending GRN can be confirmed', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.PENDING_VERIFICATION,
      GRN_STATUS.CONFIRMED
    ),
    true
  );
});

test('Confirmed GRN can be reversed', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.CONFIRMED,
      GRN_STATUS.REVERSED
    ),
    true
  );
});

test('Draft GRN cannot be confirmed directly', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.DRAFT,
      GRN_STATUS.CONFIRMED
    ),
    false
  );
});

test('Reversed GRN cannot return to draft', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.REVERSED,
      GRN_STATUS.DRAFT
    ),
    false
  );
});

test('Confirmed GRN cannot be submitted again', () => {
  assert.equal(
    canChangeGRNStatus(
      GRN_STATUS.CONFIRMED,
      GRN_STATUS.PENDING_VERIFICATION
    ),
    false
  );
});

test('GRN cannot transition to its current status', () => {
  for (const status of Object.values(GRN_STATUS)) {
    assert.equal(
      canChangeGRNStatus(status, status),
      false
    );
  }
});

test('Reversed GRN has no allowed next status', () => {
  for (const status of Object.values(GRN_STATUS)) {
    assert.equal(
      canChangeGRNStatus(
        GRN_STATUS.REVERSED,
        status
      ),
      false
    );
  }
});
