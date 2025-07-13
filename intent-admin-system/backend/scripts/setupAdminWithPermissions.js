const { sequelize, User, Role, Permission, UserRole, RolePermission } = require('../src/models');
const bcrypt = require('bcrypt');
const { SYSTEM_PERMISSIONS, SYSTEM_ROLES } = require('../src/constants/permissions');

async function setupAdminWithPermissions() {
  try {
    console.log('🚀 开始设置管理员用户和权限系统...');
    
    // 1. 确保数据库同步
    await sequelize.sync();
    console.log('✅ 数据库同步完成');
    
    // 2. 初始化系统权限
    console.log('📋 初始化系统权限...');
    for (const permissionData of SYSTEM_PERMISSIONS) {
      // 处理依赖字段 - 将数组转换为JSON字符串
      const processedData = {
        ...permissionData,
        isSystem: true,
        status: 'active'
      };
      
      // 如果有dependencies字段且为数组，转换为JSON字符串
      if (permissionData.dependencies && Array.isArray(permissionData.dependencies)) {
        processedData.dependencies = JSON.stringify(permissionData.dependencies);
      }
      
      // 如果有constraints字段且为数组/对象，转换为JSON字符串
      if (permissionData.constraints && typeof permissionData.constraints === 'object') {
        processedData.constraints = JSON.stringify(permissionData.constraints);
      }
      
      const [permission, created] = await Permission.findOrCreate({
        where: { code: permissionData.code },
        defaults: processedData
      });
      
      if (created) {
        console.log(`  ➕ 创建权限: ${permission.code}`);
      }
    }
    
    // 3. 初始化系统角色
    console.log('👥 初始化系统角色...');
    for (const roleData of SYSTEM_ROLES) {
      const [role, created] = await Role.findOrCreate({
        where: { code: roleData.code },
        defaults: {
          code: roleData.code,
          name: roleData.name,
          description: roleData.description,
          level: roleData.level,
          isSystem: roleData.isSystem,
          isDefault: roleData.isDefault || false,
          color: roleData.color,
          icon: roleData.icon,
          status: 'active'
        }
      });
      
      if (created) {
        console.log(`  ➕ 创建角色: ${role.code}`);
      }
      
      // 为角色分配权限
      if (roleData.permissions.includes('*')) {
        // 超级管理员拥有所有权限
        const allPermissions = await Permission.findAll();
        await role.setPermissions(allPermissions);
        console.log(`  🔑 为角色 ${role.code} 分配了所有权限`);
      } else {
        // 根据权限代码分配权限
        const permissions = await Permission.findAll({
          where: {
            code: roleData.permissions
          }
        });
        await role.setPermissions(permissions);
        console.log(`  🔑 为角色 ${role.code} 分配了 ${permissions.length} 个权限`);
      }
    }
    
    // 4. 创建或更新管理员用户
    console.log('👤 设置管理员用户...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [adminUser, userCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        realName: '系统管理员'
      }
    });
    
    if (userCreated) {
      console.log('  ➕ 创建管理员用户');
    } else {
      console.log('  ♻️  管理员用户已存在，更新密码');
      adminUser.password = hashedPassword;
      await adminUser.save();
    }
    
    // 5. 为管理员分配超级管理员角色
    const superAdminRole = await Role.findOne({ where: { code: 'super_admin' } });
    const adminRole = await Role.findOne({ where: { code: 'admin' } });
    
    if (superAdminRole) {
      const [userRole, roleAssigned] = await UserRole.findOrCreate({
        where: {
          userId: adminUser.id,
          roleId: superAdminRole.id
        }
      });
      
      if (roleAssigned) {
        console.log('  🔐 为管理员分配超级管理员角色');
      } else {
        console.log('  ✅ 管理员已拥有超级管理员角色');
      }
    }
    
    if (adminRole) {
      const [userRole, roleAssigned] = await UserRole.findOrCreate({
        where: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      });
      
      if (roleAssigned) {
        console.log('  🔐 为管理员分配系统管理员角色');
      } else {
        console.log('  ✅ 管理员已拥有系统管理员角色');
      }
    }
    
    // 6. 验证权限设置
    console.log('🔍 验证权限设置...');
    const userWithRoles = await User.findByPk(adminUser.id, {
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      }]
    });
    
    console.log(`  👤 用户: ${userWithRoles.username}`);
    console.log(`  🎭 角色数量: ${userWithRoles.roles.length}`);
    
    let totalPermissions = 0;
    userWithRoles.roles.forEach(role => {
      console.log(`    - ${role.name} (${role.code}): ${role.permissions.length} 个权限`);
      totalPermissions += role.permissions.length;
    });
    
    console.log(`  🔑 总权限数量: ${totalPermissions}`);
    
    console.log('\n🎉 管理员用户和权限系统设置完成！');
    console.log('📋 登录信息:');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log('  邮箱: admin@example.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 设置失败:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

setupAdminWithPermissions(); 