import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import readline from 'readline';

const askInteractive = async (question: string, silent = false): Promise<string> => {
  if (!process.stdin.isTTY) {
    throw new Error('No TTY available. Please set environment variables ADMIN_LOGIN and ADMIN_PASSWORD.');
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return await new Promise<string>((resolve) => {
    if (silent) {
      // Temporarily mute output for password input
      const onData = (char: Buffer) => {
        const charStr = char.toString('utf8');
        if (charStr === '\n' || charStr === '\r' || charStr === '\u0004') {
          process.stdout.write('\n');
        } else {
          process.stdout.write('*');
        }
      };
      process.stdin.on('data', onData);
      rl.question(question, (answer) => {
        process.stdin.off('data', onData);
        rl.close();
        resolve(answer);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
};

const getCredentials = async (): Promise<{ login: string; password: string; note?: string }> => {
  let login = (process.env.ADMIN_LOGIN || '').trim();
  let password = (process.env.ADMIN_PASSWORD || '').trim();
  const note = (process.env.ADMIN_NOTE || 'Created via createAdmin script').trim();

  if (!login) {
    try {
      login = (await askInteractive('Admin login: ')).trim();
    } catch (e) {
      throw new Error('ADMIN_LOGIN is required. Provide via env or interactive TTY.');
    }
  }
  if (!password) {
    try {
      password = (await askInteractive('Admin password: ', true)).trim();
    } catch (e) {
      throw new Error('ADMIN_PASSWORD is required. Provide via env or interactive TTY.');
    }
  }
  if (!login) throw new Error('Admin login cannot be empty');
  if (password.length < 6) throw new Error('Admin password must be at least 6 characters');
  return { login, password, note };
};

const createDefaultAdmin = async () => {
  try {
    const { login, password, note } = await getCredentials();
    // Check if admin already exists by provided login
    const existingAdmin = await prisma.callcentreAdmin.findUnique({
      where: { login }
    });

    if (existingAdmin) {
      console.log(`Admin user already exists: ${login}`);
      return;
    }

    // Create admin with provided credentials
    const hashedPassword = await hashPassword(password);
    
    const admin = await prisma.callcentreAdmin.create({
      data: {
        login,
        password: hashedPassword,
        note
      }
    });

    console.log('✅ Default admin created successfully:');
    console.log(`Login: ${login}`);
    console.log(`Password: (hidden)`);
    console.log(`ID: ${admin.id}`);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  createDefaultAdmin();
}

export { createDefaultAdmin };
