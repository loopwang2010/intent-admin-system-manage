const { sequelize, User } = require('../src/models');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    await sequelize.sync();
    
    // 检查是否已存在admin用户
    const existingUser = await User.findOne({ where: { username: 'admin' } });
    if (existingUser) {
      console.log('管理员账户已存在');
      process.exit(0);
    }
    
    // 创建加密密码
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // 创建管理员用户
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      realName: '系统管理员'
    });
    
    console.log('✅ 管理员账户创建成功');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('邮箱: admin@example.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error);
    process.exit(1);
  }
}

createAdmin(); 