import { firebaseService } from './firebaseService.ts';

const user = await firebaseService.getDocument('users', 'usr-admin-1');

console.log('Admin user found:', !!user);

if (user) {
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Status:', user.status);
  console.log('Has password:', !!user.password);
  console.log('Password length:', user.password?.length || 0);
}

process.exit(0);
