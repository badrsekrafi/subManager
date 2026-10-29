import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCSV } from '../src/utils/csv.js'
import { formatDate, formatDateTime, formatRelativeDate } from '../src/utils/formatters.js'

test('CSV exports preserve commas, quotes, hashtags, accented text and newlines', () => {
  assert.equal(
    toCSV(['Client', 'Notes'], [['QA, "Test"', 'Réglé #1\nSuite'], ['علي', null]]),
    '"Client","Notes"\r\n"QA, ""Test""","Réglé #1\nSuite"\r\n"علي",""',
  )
})

test('clearing or entering an invalid date never crashes a form preview', () => {
  for (const formatter of [formatDate, formatDateTime, formatRelativeDate]) {
    assert.equal(formatter(''), '-')
    assert.equal(formatter('not-a-date'), '-')
    assert.equal(formatter(new Date(NaN)), '-')
  }
  assert.equal(formatDate('2026-10-29'), '29/10/2026')
})
