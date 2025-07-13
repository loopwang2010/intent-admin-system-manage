<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">个人资料</h1>
    </div>
    
    <div class="page-content">
      <el-row :gutter="20">
        <el-col :span="8">
          <!-- 头像和基本信息 -->
          <div class="profile-card">
            <div class="avatar-section">
              <el-avatar :size="80">
                {{ authStore.user?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <h3>{{ authStore.user?.username }}</h3>
              <p>{{ getRoleText(authStore.user?.role) }}</p>
            </div>
            
            <div class="info-section">
              <div class="info-item">
                <span class="label">邮箱：</span>
                <span class="value">{{ authStore.user?.email }}</span>
              </div>
              <div class="info-item">
                <span class="label">角色：</span>
                <span class="value">{{ getRoleText(authStore.user?.role) }}</span>
              </div>
              <div class="info-item">
                <span class="label">状态：</span>
                <el-tag type="success">{{ authStore.user?.status === 'active' ? '活跃' : '禁用' }}</el-tag>
              </div>
              <div class="info-item">
                <span class="label">最后登录：</span>
                <span class="value">{{ authStore.user?.last_login || '暂无记录' }}</span>
              </div>
              <div class="info-item">
                <span class="label">注册时间：</span>
                <span class="value">{{ authStore.user?.created_at || '暂无记录' }}</span>
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="16">
          <!-- 编辑表单 -->
          <div class="edit-form-card">
            <h3>编辑资料</h3>
            <el-form 
              :model="form" 
              :rules="rules" 
              ref="formRef"
              label-width="100px"
            >
              <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" disabled />
              </el-form-item>
              
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" />
              </el-form-item>
              
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="form.nickname" placeholder="请输入昵称" />
              </el-form-item>
              
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="form.phone" placeholder="请输入手机号" />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSave">保存修改</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 修改密码 -->
          <div class="password-card">
            <h3>修改密码</h3>
            <el-form 
              :model="passwordForm" 
              :rules="passwordRules" 
              ref="passwordFormRef"
              label-width="100px"
            >
              <el-form-item label="当前密码" prop="currentPassword">
                <el-input 
                  v-model="passwordForm.currentPassword" 
                  type="password" 
                  show-password
                  placeholder="请输入当前密码"
                />
              </el-form-item>
              
              <el-form-item label="新密码" prop="newPassword">
                <el-input 
                  v-model="passwordForm.newPassword" 
                  type="password" 
                  show-password
                  placeholder="请输入新密码"
                />
              </el-form-item>
              
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input 
                  v-model="passwordForm.confirmPassword" 
                  type="password" 
                  show-password
                  placeholder="请再次输入新密码"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/modules/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()

const formRef = ref()
const passwordFormRef = ref()

const form = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const getRoleText = (role) => {
  const roleMap = {
    admin: '管理员',
    editor: '编辑员',
    viewer: '查看员'
  }
  return roleMap[role] || role
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    console.log('保存用户资料', form)
    ElMessage.success('资料保存成功')
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleReset = () => {
  Object.assign(form, {
    username: authStore.user?.username || '',
    email: authStore.user?.email || '',
    nickname: authStore.user?.nickname || '',
    phone: authStore.user?.phone || ''
  })
}

const handleChangePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    console.log('修改密码', passwordForm)
    ElMessage.success('密码修改成功')
    
    // 重置密码表单
    Object.assign(passwordForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  } catch (error) {
    console.error('密码表单验证失败:', error)
  }
}

onMounted(() => {
  // 初始化表单数据
  handleReset()
})
</script>

<style scoped>
.profile-card {
  background: var(--bg-color);
  padding: 24px;
  border-radius: 8px;
  box-shadow: var(--box-shadow-base);
  margin-bottom: 20px;
}

.avatar-section {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-lighter);
  margin-bottom: 20px;
}

.avatar-section h3 {
  margin: 12px 0 4px 0;
  color: var(--text-primary);
}

.avatar-section p {
  color: var(--text-secondary);
  margin: 0;
}

.info-section .info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-extra-light);
}

.info-item .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.info-item .value {
  color: var(--text-primary);
}

.edit-form-card,
.password-card {
  background: var(--bg-color);
  padding: 24px;
  border-radius: 8px;
  box-shadow: var(--box-shadow-base);
  margin-bottom: 20px;
}

.edit-form-card h3,
.password-card h3 {
  margin: 0 0 20px 0;
  color: var(--text-primary);
}
</style> 