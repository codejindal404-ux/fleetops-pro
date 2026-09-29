import bcrypt from 'bcryptjs';
import { firebaseService } from './firebaseService.ts';

const password = 'Password123!';
const hash = await bcrypt.hash(password, 10);

await firebaseService.updateDocument('users', 'usr-admin-1', {
  password: hash
});

console.log('Admin password updated successfully.');
console.log('Hash length:', hash.length);

process.exit(0);
