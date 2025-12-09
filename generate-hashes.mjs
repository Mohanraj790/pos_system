// Script to generate bcrypt password hashes for seed data
import bcrypt from 'bcryptjs';

const passwords = [
    { username: 'admin', password: 'admin123' },
    { username: 'cashier', password: 'cashier123' }
];

console.log('Generating password hashes...\n');

passwords.forEach(({ username, password }) => {
    const hash = bcrypt.hashSync(password, 10);
    console.log(`${username} / ${password}:`);
    console.log(`  Hash: ${hash}\n`);
});
