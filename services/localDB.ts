import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabaseSync('DAAEM');

// ---
export async function setupDatabase() {
   db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT NOT NULL,
         numberId TEXT NOT NULL,
         pictureUri TEXT
      );
   `);
}
// ---
export async function getAllUsers() {
   return await db.getAllAsync('SELECT * FROM users ORDER BY id DESC');
}
// ---
export async function insertUser(name: string, numberId: string, pictureUri: string) {
   return (await db.runAsync(
      'INSERT INTO users (name, numberId, pictureUri) VALUES (?, ?, ?)', name, numberId, pictureUri
   )).lastInsertRowId;
}
// ---
export async function updateUser(userId: number, name: string, numberId: string, pictureUri: string) {
   await db.runAsync(
      'UPDATE users SET name = ?, numberId = ?, pictureUri = ? WHERE id = ?', name, numberId, pictureUri, userId
   );
}
// ---
export async function deleteUser(userId: number) {
   await db.runAsync('DELETE FROM users WHERE id = ?', userId);
}
// ---
export async function deleteAllUsers() {
   await db.runAsync('DELETE FROM users');
}