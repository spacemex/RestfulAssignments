export type User = {
    id: string;
    email: string;
    username: string;
    password_hash: string;
};

export type ValidatorKey = 'username' | 'email' | 'id';
