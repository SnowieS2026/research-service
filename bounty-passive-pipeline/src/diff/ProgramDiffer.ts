import type { NormalisedProgram } from '../browser/parsers/BaseParser.js';

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  added: boolean;
  removed: boolean;
}

export interface DiffResult {
  identifier: string;
  oldHash: string;
  newHash: string;
  addedFields: FieldDiff[];
  removedFields: FieldDiff[];
  changedFields: FieldDiff[];
}

/**
 * Compares two NormalisedProgram snapshots and returns field-level diffs.
 */
export function diffPrograms(
  oldProg: NormalisedProgram,
  newProg: NormalisedProgram,
  oldHash: string,
  newHash: string,
  identifier: string
): DiffResult {
  const addedFields: FieldDiff[] = [];
  const removedFields: FieldDiff[] = [];
  const changedFields: FieldDiff[] = [];

  const allKeys = new Set([...Object.keys(oldProg), ...Object.keys(newProg)]);

  for (const key of allKeys) {
    const typedKey = key as keyof NormalisedProgram;
    const oldVal = oldProg[typedKey];
    const newVal = newProg[typedKey];
    if (!(typedKey in oldProg)) {
      addedFields.push({ field: typedKey, oldValue: undefined, newValue: newVal, added: true, removed: false });
    } else if (!(typedKey in newProg)) {
      removedFields.push({ field: typedKey, oldValue: oldVal, newValue: undefined, added: false, removed: true });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changedFields.push({ field: typedKey, oldValue: oldVal, newValue: newVal, added: false, removed: false });
    }
  }

  return { identifier, oldHash, newHash, addedFields, removedFields, changedFields };
}
