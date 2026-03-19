/**
 * Compares two NormalisedProgram snapshots and returns field-level diffs.
 */
export function diffPrograms(oldProg, newProg, oldHash, newHash, identifier) {
    const addedFields = [];
    const removedFields = [];
    const changedFields = [];
    const allKeys = new Set([...Object.keys(oldProg), ...Object.keys(newProg)]);
    for (const key of allKeys) {
        const typedKey = key;
        const oldVal = oldProg[typedKey];
        const newVal = newProg[typedKey];
        if (!(typedKey in oldProg)) {
            addedFields.push({ field: typedKey, oldValue: undefined, newValue: newVal, added: true, removed: false });
        }
        else if (!(typedKey in newProg)) {
            removedFields.push({ field: typedKey, oldValue: oldVal, newValue: undefined, added: false, removed: true });
        }
        else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changedFields.push({ field: typedKey, oldValue: oldVal, newValue: newVal, added: false, removed: false });
        }
    }
    return { identifier, oldHash, newHash, addedFields, removedFields, changedFields };
}
