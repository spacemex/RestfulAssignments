import type {User, ValidatorKey} from '../types/Types';

const cache = new Set<User>();

export const Validator: Map<ValidatorKey, RegExp> = new Map<ValidatorKey, RegExp>();
Validator.set('email', /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i);
Validator.set('username', RegExp('^[a-z0-9_]{5,}$', 'i'));
Validator.set('id', RegExp('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'))

export function CanCreateUser(user: Pick<User, 'email' | 'username'>): boolean {
    const email = user.email.trim().toLowerCase();
    const username = user.username.trim().toLowerCase();

    for (const existingUser of cache) {
        if (existingUser.email.trim().toLowerCase() === email || existingUser.username.trim().toLowerCase() === username) {
            return false;
        }
    }

    return true;
}


export function AddNewUser(user: User): boolean {
    if (!user || typeof user !== 'object') {
        return false;
    }

    if (!user.username || !user.username.trim().length) {
        console.log('username failed');
        return false;
    }

    if (!user.email || !user.email.trim().length) {
        console.log('email failed');
        return false;
    }

    if (!user.id || !user.id.trim().length) {
        console.log('id failed');
        return false;
    }

    if (!user.password_hash || !user.password_hash.trim().length) {
        return false;
    }

    if (!Validator.get('username')?.test(user.username.trim())) {
        return false;
    }

    if (!Validator.get('email')?.test(user.email.trim())) {
        return false;
    }

    if (!Validator.get('id')?.test(user.id.trim())) {
        return false;
    }

    if (!CanCreateUser(user)) {
        return false;
    }

    cache.add(user);
    return true;
}

export function RemoveUser(id: string): boolean {
    if (!id || typeof id !== 'string') {
        console.log('id no string || invalid id');
        return false;
    }

    if (!id.trim().length) {
        console.log('bad length');
        return false;
    }

    if (!Validator.get('id')?.test(id.trim())) {
        console.log('invalid id regex')
        return false;
    }

    let user: User | undefined;

    for (const foundUser of cache) {
        if (foundUser.id.trim() === id.trim()) {
            user = foundUser;
            break;
        }
    }

    if (!user || typeof user === 'undefined') {
        console.log('no user');
        return false;
    }

    return cache.delete(user);
}

export function GetAllUsers(): User[] {
    const users: User[] = [];
    for (const user of cache) {
        users.push(user);
    }

    return users;
}

export function FindUserByUsername(username: string): User | undefined {
    if (!username || !username.trim().length || !Validator.get('username')?.test(username.trim())) {
        return undefined;
    }

    let user: User | undefined = undefined;

    for (const foundUser of cache) {
        if (foundUser.username.trim() === username.trim()) {
            user = foundUser;
            break;
        }
    }

    return user;
}

export function FindUserByEmail(email: string): User | undefined {
    if (!email || !email.trim().length || !Validator.get('email')?.test(email.trim())) {
        return undefined;
    }

    let user: User | undefined = undefined;
    for (const foundUser of cache) {
        if (foundUser.email.trim() === email.trim()) {
            user = foundUser;
            break;
        }
    }

    return user;
}

export function FindUserById(id: string): User | undefined {
    if (!id || !id.trim().length || !Validator.get('id')?.test(id.trim())) {
        return undefined;
    }

    let User: User | undefined = undefined;

    for (const foundUser of cache) {
        if (foundUser.id.trim() === id.trim()) {
            User = foundUser;
            break;
        }
    }

    return User;
}