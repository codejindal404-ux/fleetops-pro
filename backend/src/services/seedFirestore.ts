import { runFirebaseSeed } from './firebaseSeed.ts';

export async function seedFirestore() {
  await runFirebaseSeed();
}
