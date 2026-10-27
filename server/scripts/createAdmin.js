// Create the first administrator (or promote an existing user) from the command line.
//   npm run create-admin -- --username admin --email admin@example.com --password "StrongPass123"
// Omit --password to be prompted. Env vars ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD also work.
import readline from 'readline/promises';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);

async function ask(rl, label, current) {
  return current || (await rl.question(`${label}: `)).trim();
}

async function run() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const username = await ask(rl, 'Username', args.username || process.env.ADMIN_USERNAME);
  const email = (await ask(rl, 'Email', args.email || process.env.ADMIN_EMAIL)).toLowerCase();
  const password = await ask(rl, 'Password (min 8 chars, letter + number; visible as you type)', args.password || process.env.ADMIN_PASSWORD);
  rl.close();

  if (username.length < 3 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('A username (3+ chars) and a valid email are required.');
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Password must be at least 8 characters with a letter and a number.');
  }

  await connectDB();
  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    await user.save();
    console.log(`Existing account ${email} promoted to admin (its password was NOT changed).`);
  } else {
    user = await User.create({ username, email, password, role: 'admin' });
    console.log(`✔ Admin account created for ${email}.`);
  }
  await Admin.findOneAndUpdate({ user: user._id }, { $setOnInsert: { user: user._id, displayName: user.username } }, { upsert: true });
}

run()
  .catch((err) => {
    console.error(`✖ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
