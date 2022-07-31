import { DB_PASS, DB_LOCAL_URI, DB_USER, DB_REMOTE_URI } from '../config';

export const DB_CONFIG_STRING = () => {
    if (DB_LOCAL_URI) return DB_LOCAL_URI;
    if (!DB_USER) throw new Error('DB_USER is not defined');
    if (!DB_PASS) throw new Error('DB_PASS is not defined');
    if (!DB_REMOTE_URI) throw new Error('DB_REMOTE_URI is not defined');
    return `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_REMOTE_URI}`;
};
