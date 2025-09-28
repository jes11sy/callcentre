import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';

const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.callcentreAdmin.findUnique({
      where: { login: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin
    const hashedPassword = await hashPassword('admin123');
    
    const admin = await prisma.callcentreAdmin.create({
      data: {
        login: 'admin',
        password: hashedPassword,
        note: 'Default admin user'
      }
    });

    console.log('✅ Default admin created successfully:');
    console.log(`Login: admin`);
    console.log(`Password: admin123`);
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
