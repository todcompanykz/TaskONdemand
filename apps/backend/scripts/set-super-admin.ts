import dataSource from '../src/database/data-source';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/common/enums/user-role.enum';

async function setSuperAdmin() {
  const targetEmail = 'super@admin.com';
  
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');
    
    const userRepository = dataSource.getRepository(User);
    
    console.log(`Searching for user with email: ${targetEmail}`);
    const user = await userRepository.findOne({
      where: { email: targetEmail },
    });
    
    if (!user) {
      console.error(`❌ User with email ${targetEmail} not found`);
      console.log('Available users:');
      const allUsers = await userRepository.find({
        select: ['id', 'email', 'role'],
      });
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (role: ${u.role})`);
      });
      await dataSource.destroy();
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email} (current role: ${user.role})`);
    
    if (user.role === UserRole.SUPER_ADMIN) {
      console.log(`✅ User ${user.email} already has SUPER_ADMIN role`);
    } else {
      user.role = UserRole.SUPER_ADMIN;
      user.permissions = [];
      
      await userRepository.save(user);
      console.log(`✅ Successfully set SUPER_ADMIN role for ${user.email}`);
    }
    
    // Verify the update
    const updatedUser = await userRepository.findOne({
      where: { email: targetEmail },
      select: ['id', 'email', 'role', 'permissions'],
    });
    
    console.log('\nVerification:');
    console.log(`  Email: ${updatedUser?.email}`);
    console.log(`  Role: ${updatedUser?.role}`);
    console.log(`  Permissions: ${JSON.stringify(updatedUser?.permissions)}`);
    
    await dataSource.destroy();
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

setSuperAdmin();
