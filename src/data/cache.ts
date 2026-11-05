import type {TodoEntry} from "../types/Types";

const cache = new Map<string, TodoEntry>();

/**
 * Safely add a new entry to the cache
 *
 * @param key unique identifier for the entry
 * @param value the To-Do Entry
 */
export function AddEntry(key: string, value: TodoEntry): boolean {
    if (!_validateKeyFormat_(key) || !value || typeof value !== 'object') {
        return false;
    }

    if (cache.has(key)) {
        return false;
    }

    return !!cache.set(key, value);
}

/**
 * Remove a To-Do Entry from the cache
 *
 * @param key unique identifier for the entry
 */
export function RemoveEntry(key: string): boolean {
    if (!key || typeof key !== 'string') {
        return false;
    }

    return cache.delete(key);
}

/**
 * Retrieve a To-Do Entry from the cache
 *
 * @param key unique identifier for the entry
 */
export function RetrieveEntry(key: string): TodoEntry | undefined {
    if (!_validateKeyFormat_(key) || !cache.has(key)) {
        return undefined
    }

    return cache.get(key);
}

/**
 * Retrieve All To-Do Entries from the cache
 */
export function RetrieveAllEntries(): TodoEntry[] {
    return [...cache.values()];
}

/**
 * Does the cache Have this key?
 *
 * @param key unique identifier for the entry
 */
export function CacheHasKey(key: string): boolean {
    if (!_validateKeyFormat_(key)) {
        return false;
    }

    return cache.has(key);
}

/**
 * Internal Function, Used to validate the key format
 *
 * @param key unique identifier for the entry
 */
function _validateKeyFormat_(key: string): boolean {
    return !(!key || typeof key !== 'string' || !key.trim().length);
}