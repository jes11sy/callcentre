import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';

const resetAdminPassword = async () => {
  try {
    // Find admin user
    const admin = await prisma.callcentreAdmin.findUnique({
      where: { login: 'admin' }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log(`ID: ${admin.id}`);
    console.log(`Login: ${admin.login}`);
    console.log(`Created: ${admin.createdAt}`);

    // Test current password
    const testPassword = 'admin123';
    const isCurrentPasswordValid = await comparePassword(testPassword, admin.password);
    
    console.log(`\n🔍 Testing current password "${testPassword}": ${isCurrentPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

    if (!isCurrentPasswordValid) {
      console.log('\n🔄 Resetting password to "admin123"...');
      
      // Reset password
      const newHashedPassword = await hashPassword('admin123');
      
      await prisma.callcentreAdmin.update({
        where: { id: admin.id },
        data: { password: newHashedPassword }
      });

      console.log('✅ Password reset successfully!');
      console.log('\n📋 Login credentials:');
      console.log(`Login: admin`);
      console.log(`Password: admin123`);
    } else {
      console.log('\n✅ Current password is correct!');
      console.log('\n📋 Login credentials:');
      console.log(`Login: admin`);
      console.log(`Password: admin123`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  resetAdminPassword();
}

export { resetAdminPassword };
