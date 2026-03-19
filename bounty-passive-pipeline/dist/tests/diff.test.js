import { test, expect } from '@playwright/test';
import { diffPrograms } from '../src/diff/ProgramDiffer.js';
import { SnapshotManager } from '../src/storage/SnapshotManager.js';
const progV1 = {
    platform: 'bugcrowd',
    program_name: 'Bugcrowd Test Program v1',
    program_url: 'https://bugcrowd.com/program/test',
    scope_assets: ['example.com', 'www.example.com'],
    exclusions: ['thirdparty.com'],
    reward_range: '$100-$500',
    reward_currency: 'USD',
    payout_notes: '',
    allowed_techniques: [],
    prohibited_techniques: [],
    last_seen_at: '2026-03-19',
    source_snapshot_hash: 'hash_v1'
};
const progV2Changed = {
    platform: 'bugcrowd',
    program_name: 'Bugcrowd Test Program v2',
    program_url: 'https://bugcrowd.com/program/test',
    scope_assets: ['example.com', 'www.example.com', 'api.example.com'],
    exclusions: ['thirdparty.com', 'olddomain.com'],
    reward_range: '$200-$1000',
    reward_currency: 'USD',
    payout_notes: 'Updated payout notes',
    allowed_techniques: [],
    prohibited_techniques: [],
    last_seen_at: '2026-03-20',
    source_snapshot_hash: 'hash_v2'
};
test('diffPrograms() detects added fields', () => {
    const oldProg = { ...progV1 };
    const newProg = { ...progV2Changed, newField: 'added value' };
    const result = diffPrograms(oldProg, newProg, 'hash_v1', 'hash_v2', 'bugcrowd-test');
    const addedFieldNames = result.addedFields.map((f) => f.field);
    expect(addedFieldNames).toContain('newField');
    const changedFieldNames = result.changedFields.map((f) => f.field);
    expect(changedFieldNames).not.toContain('newField');
});
test('diffPrograms() detects removed fields', () => {
    const newProg = Object.assign({}, progV2Changed);
    delete newProg.payout_notes;
    const oldProg = { ...progV2Changed, payout_notes: 'something' };
    const result = diffPrograms(oldProg, newProg, 'h1', 'h2', 'test');
    const removedFieldNames = result.removedFields.map((f) => f.field);
    expect(removedFieldNames).toContain('payout_notes');
});
test('diffPrograms() detects changed field values', () => {
    const result = diffPrograms(progV1, progV2Changed, 'hash_v1', 'hash_v2', 'bugcrowd-test');
    const changedFieldNames = result.changedFields.map((f) => f.field);
    expect(changedFieldNames).toContain('program_name');
    expect(changedFieldNames).toContain('reward_range');
    expect(changedFieldNames).toContain('last_seen_at');
    expect(changedFieldNames).toContain('scope_assets');
});
test('diffPrograms() reports zero diff for identical programs', () => {
    const result = diffPrograms(progV1, progV1, 'hash1', 'hash1', 'test');
    expect(result.addedFields).toHaveLength(0);
    expect(result.removedFields).toHaveLength(0);
    expect(result.changedFields).toHaveLength(0);
});
test('SnapshotManager.store() returns a deterministic SHA-256 hash', async () => {
    const mgr = new SnapshotManager();
    const data = { platform: 'bugcrowd', program_name: 'Test' };
    const h1 = await mgr.store(data, 'deterministic-test');
    const h2 = await mgr.store(data, 'deterministic-test');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
});
test('SnapshotManager.list() returns previously stored hashes for an identifier', async () => {
    const mgr = new SnapshotManager();
    const id = `list-test-${Date.now()}`;
    await mgr.store({ platform: 'bugcrowd' }, id);
    await mgr.store({ platform: 'bugcrowd', program_name: 'Test' }, id);
    const hashes = await mgr.list(id);
    expect(hashes.length).toBeGreaterThanOrEqual(2);
});
