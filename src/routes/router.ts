import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import type {User, ValidatorKey} from "../types/Types";
import {
    CanCreateUser,
    AddNewUser,
    Validator,
    GetAllUsers,
    FindUserByEmail,
    FindUserByUsername,
    FindUserById, RemoveUser
} from "../data/cache";

import {randomUUID} from "node:crypto";

export const router = express.Router();

const JWTSecret = process.env.JWTSecret ?? 'secret';

/**
 * Get All Users
 */
router.get('/', (_req, res) => {
    const users: User[] = GetAllUsers();

    let sanitizedUsers: object[] = [];

    for (const user of users) {
        const cleaned = {
            id: user.id,
            username: user.username,
        }

        sanitizedUsers.push(cleaned);
    }

    res.status(200).json({data: sanitizedUsers});
});

/**
 * Create New User
 */
router.post('/auth/register', async (req, res) => {
    const user = req.body;

    if (!user || typeof user !== 'object') {
        return res.status(400).json({message: 'Invalid / Malformed Body'});
    }

    if (!user.email || !user.username || !user.password) {
        return res.status(400).json({message: 'Invalid / Malformed Body. `email`, `username`, `password` are required'});
    }

    if (typeof user.email !== 'string' || typeof user.username !== 'string' || typeof user.password !== 'string') {
        return res.status(400).json({message: 'Invalid / Malformed Body. `email`, `username`, `password` keys must be of type string'});
    }

    if (!user.email.trim().length || !user.username.trim().length) {
        return res.status(400).json({message: 'Invalid / Malformed Body. `email`, `username` are required'});
    }

    if (!user.password.trim().length || !(user.password.trim().length >= 5)) {
        return res.status(400).json({message: '`password` must be at least 5 characters'});
    }

    if (!Validator.get('email')?.test(user.email.trim())) {
        return res.status(400).json({message: 'Invalid email format'});
    }

    if (!Validator.get('username')?.test(user.username.trim())) {
        return res.status(400).json({message: 'Invalid username. [a-z0-9_]'});
    }

    const salt = 10;
    const hash: string = await bcrypt.hash(user.password.trim(), salt);

    const sanitizedUser: User = {
        id: randomUUID(),
        email: user.email.trim(),
        username: user.username.trim(),
        password_hash: hash
    };

    if (!CanCreateUser(user)) {
        return res.status(400).json({message: 'Username Or Email Already Exists.'});
    }

    if (!AddNewUser(sanitizedUser)) {
        return res.status(400).json({message: 'Add new user already exists'});
    }

    return res.status(201).json({
        data: {
            id: sanitizedUser.id,
            username: sanitizedUser.username,
            email: sanitizedUser.email,
        }
    });
});

/**
 * Login A User
 *
 * In Production Environment, Change From Sent Token To Cookie / Sessions
 */
router.post('/auth/login', async (req, res) => {
    if (!req.body) {
        return res.status(400).json({message: 'Invalid / Malformed Body'});
    }

    const {identity, password} = req.body;

    if (!identity || !password || typeof identity !== 'string' || typeof password !== 'string') {
        return res.status(401).json({message: 'Invalid Credentials'});
    }

    let identityType: ValidatorKey | undefined = undefined;

    if (Validator.get('id')?.test(identity.trim())) {
        identityType = 'id';
    } else if (Validator.get('email')?.test(identity.trim())) {
        identityType = 'email';
    } else if (Validator.get('username')?.test(identity.trim())) {
        identityType = 'username';
    } else {
        identityType = undefined;
    }

    if (typeof identityType === 'undefined') {
        return res.status(401).json({message: 'Invalid Credentials'});
    }

    let User: User | undefined = undefined;

    switch (identityType) {
        case 'id': {
            User = FindUserById(identity.trim());
            break;
        }
        case "email": {
            User = FindUserByEmail(identity.trim());
            break;
        }
        case "username": {
            User = FindUserByUsername(identity.trim());
        }
    }

    if (!User || typeof User === 'undefined') {
        return res.status(401).json({message: 'Invalid Credentials'});
    }

    const isCorrectPasswordForAccount: boolean = await bcrypt.compare(password, User.password_hash);

    if (!isCorrectPasswordForAccount) {
        return res.status(401).json({message: 'Invalid Credentials'});
    }

    const sessionToken: string = jwt.sign({
        id: User.id,
        username: User.username
    }, JWTSecret, {expiresIn: '30m'});

    return res.status(200).json({
        data: {
            id: User.id,
            username: User.username,
            email: User.email,
            session: sessionToken,
        }
    });
});

/**
 * Display User Profile Info
 *
 * In Production Environment, Change To Middleware Validation
 */
router.get('/auth/me', async (req, res) => {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({message: 'Missing Authorization Header'});
    }

    const parts = auth.split(' ');
    const token = parts.length === 1 ? parts[0] : parts[1];

    if (!token || typeof token === 'undefined') {
        return res.status(401).json({message: 'Unauthorized'});
    }

    try {
        const decoded = jwt.verify(token, JWTSecret);

        if (typeof decoded === 'string') {
            return res.status(401).json({message: 'Invalid Authentication Token'});
        }

        const User: User | undefined = FindUserById(decoded.id);

        if (!User || typeof User === 'undefined') {
            return res.status(400).json({message: 'Invalid Authentication Token'});
        }

        return res.status(200).json({
            id: User.id,
            username: User.username,
            email: User.email,
        });
    } catch (e) {
        return res.status(401).json({message: 'Unauthorized'});
    }
});

/**
 * Remove User
 */
router.delete('/auth/delete', async (req, res) => {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({message: 'Missing Authorization Header'});
    }

    const parts = auth.split(' ');
    const token = parts.length === 1 ? parts[0] : parts[1];

    if (!token || typeof token === 'undefined') {
        return res.status(401).json({message: 'Unauthorized'});
    }

    try {
        const decoded = jwt.verify(token, JWTSecret);

        if (typeof decoded === 'string') {
            return res.status(401).json({message: 'Invalid Authentication Token'});
        }

        if (!decoded.id || typeof decoded.id === 'undefined') {
            return res.status(401).json({message: 'Invalid Id'});
        }

        if (!RemoveUser(decoded.id)) {
            return res.status(401).json({message: 'Invalid Id'});
        }

        return res.status(204).end();
    } catch (e) {
        return res.status(401).json({message: 'Unauthorized'});
    }
});