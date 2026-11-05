import express from 'express';

import type {TodoEntry} from "../types/Types";
import {RetrieveAllEntries, AddEntry, CacheHasKey, RemoveEntry, RetrieveEntry} from "../data/cache";

export const router = express.Router();

/**
 * Get All To-Do Entries
 */
router.get('/', (req, res) => {
    const entries: TodoEntry[] = RetrieveAllEntries();

    return res.status(200).json({data: entries});
});

/**
 * Get To-Do Entry by id
 */
router.get('/:id', (req, res) => {
    const id = req.params.id;

    if (!id || typeof id !== 'string' || !id.trim().length || !CacheHasKey(id)) {
        return res.status(404).json({message: 'Invalid id/key provided'});
    }

    const entry: TodoEntry | undefined = RetrieveEntry(id);

    if (!entry || typeof entry !== 'object') {
        return res.status(500).json({message: 'Server Error: Invalid / Malformed To-Do Entry'});
    }

    return res.status(200).json({data: entry});
});

/**
 * Create a new To-Do Entry
 */
router.post('/', (req, res) => {
    const entry = req.body;

    if (!entry || typeof entry !== 'object') {
        return res.status(400).json({message: 'Invalid / Malformed Body'});
    }

    if (!entry.id || !entry.title || !entry.body) {
        return res.status(400).json({message: 'Invalid / Malformed Body. `id`, `title`, `body` are required'});
    }

    if (typeof entry.id !== 'string' || typeof entry.title !== 'string' || typeof entry.body !== 'string') {
        return res.status(400).json({message: 'Invalid / Malformed Body. `id,`, `title`, `body` keys must be of type string'});
    }

    if (!entry.id.trim().length || !entry.title.trim().length || !entry.body.trim().length) {
        return res.status(400).json({message: 'Invalid / Malformed Body. `id`, `title`, `body` are required'});
    }

    if (CacheHasKey(entry.id.trim())) {
        return res.status(409).json({message: 'Duplicate key'});
    }

    if (entry.completed !== undefined && typeof entry.completed !== 'boolean') {
        return res.status(400).json({message: 'Invalid / Malformed Body. `completed` key must be of type boolean'});
    }

    const completedValue: boolean = entry.completed ?? false;

    const sanitizedEntry: TodoEntry = {
        id: entry.id.trim(),
        title: entry.title.trim(),
        body: entry.body.trim(),
        completed: completedValue,
    };

    if (!AddEntry(sanitizedEntry.id, sanitizedEntry)) {
        return res.status(500).json({message: 'Server Error: failed to create new entry'});
    }

    return res.status(201).json({data: sanitizedEntry});
});

/**
 * Update Existing To-Do Entry
 */
router.patch('/:id', (req, res) => {
    const id = req.params.id;

    if (!id || typeof id !== 'string' || !id.trim().length || !CacheHasKey(id)) {
        return res.status(404).json({message: 'Invalid id/key provided'});
    }

    const updates: unknown = req.body;

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({message: 'Invalid / Malformed Body'});
    }

    const payload = updates as Record<string, unknown>;
    const {title, body, completed} = payload;

    if (title === undefined && body === undefined && completed === undefined) {
        return res.status(400).json({message: 'At least one field is required'});
    }

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
        return res.status(400).json({message: 'Invalid key `title`'});
    }

    if (body !== undefined && (typeof body !== 'string' || !body.trim())) {
        return res.status(400).json({message: 'Invalid key `body`'});
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
        return res.status(400).json({message: 'Invalid key `completed`'});
    }

    const entry: TodoEntry | undefined = RetrieveEntry(id.trim());

    if (!entry || typeof entry !== 'object') {
        return res.status(404).json({message: 'Entry not found'});
    }

    if (typeof title === 'string') {
        entry.title = title.trim();
    }

    if (typeof body === 'string') {
        entry.body = body.trim()
    }

    if (typeof completed === 'boolean') {
        entry.completed = completed;
    }

    return res.status(200).json({data: entry});
});

/**
 * Delete a To-Do Entry
 */
router.delete('/:id', (req, res) => {
    const id = req.params.id;

    if (!id || typeof id !== 'string' || !id.trim().length || !CacheHasKey(id)) {
        return res.status(404).json({message: 'Invalid id/key provided'});
    }

    if (!RemoveEntry(id.trim())) {
        return res.status(500).json({message: 'Server Error: failed to delete entry'});
    }

    return res.status(204).end();
})