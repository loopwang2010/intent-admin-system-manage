<template>
  <div class="users-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button type="success" @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-upload
          action="#"
          :before-upload="handleImport"
          :show-file-list="false"
          accept=".xlsx,.xls"
        >
          <el-button type="warning">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
        </el-upload>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户名、邮箱或姓名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="searchForm.roleId"
            placeholder="选择角色"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card>
      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedUsers.length > 0">
        <span>已选择 {{ selectedUsers.length }} 项</span>
        <el-button type="primary" size="small" @click="showBatchRoleDialog = true">
          批量分配角色
        </el-button>
        <el-button type="info" size="small" @click="batchConfigurePermissions">
          批量权限配置
        </el-button>
        <el-button type="success" size="small" @click="batchUpdateStatus(true)">
          批量启用
        </el-button>
        <el-button type="warning" size="small" @click="batchUpdateStatus(false)">
          批量禁用
        </el-button>
        <el-button type="danger" size="small" @click="batchDelete">
          批量删除
        </el-button>
      </div>

      <el-table
        :data="users"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :alt="row.username">
              {{ row.username.charAt(0).toUpperCase() }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="realName" label="姓名" min-width="100" />
        <el-table-column prop="phone" label="电话" min-width="130" />
        <el-table-column label="角色" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.id"
              type="primary"
              size="small"
              style="margin-right: 5px"
            >
              {{ role.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="toggleUserStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.lastLoginAt) || '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewUser(row)">
              查看
            </el-button>
            <el-button type="text" size="small" @click="editUser(row)">
              编辑
            </el-button>
            <el-button type="text" size="small" @click="manageRoles(row)">
              角色管理
            </el-button>
            <el-button type="text" size="small" @click="configurePermissions(row)">
              权限配置
            </el-button>
            <el-button type="text" size="small" @click="resetPassword(row)">
              重置密码
            </el-button>
            <el-button type="text" size="small" @click="viewActivity(row)">
              活动日志
            </el-button>
            <el-button
              type="text"
              size="small"
              style="color: #f56c6c"
              @click="deleteUser(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingUser ? '编辑用户' : '新增用户'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="userForm"
        :rules="userRules"
        ref="userFormRef"
        label-width="80px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="userForm.username"
                placeholder="请输入用户名"
                :disabled="!!editingUser"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="userForm.email"
                type="email"
                placeholder="请输入邮箱"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="realName">
              <el-input
                v-model="userForm.realName"
                placeholder="请输入姓名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input
                v-model="userForm.phone"
                placeholder="请输入电话号码"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="!editingUser">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="userForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="userForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="角色" prop="roleIds">
          <el-select
            v-model="userForm.roleIds"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="部门" prop="department">
          <el-input
            v-model="userForm.department"
            placeholder="请输入部门"
          />
        </el-form-item>

        <el-form-item label="职位" prop="position">
          <el-input
            v-model="userForm.position"
            placeholder="请输入职位"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="userForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="userForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saveLoading">
          {{ editingUser ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 角色管理对话框 -->
    <el-dialog
      v-model="showRoleDialog"
      title="角色管理"
      width="500px"
    >
      <div v-if="currentUser">
        <p>为用户 <strong>{{ currentUser.username }}</strong> 分配角色：</p>
        <el-checkbox-group v-model="selectedRoleIds">
          <el-checkbox
            v-for="role in roles"
            :key="role.id"
            :label="role.id"
          >
            {{ role.name }} - {{ role.description }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveUserRoles" :loading="saveLoading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量角色分配对话框 -->
    <el-dialog
      v-model="showBatchRoleDialog"
      title="批量分配角色"
      width="500px"
    >
      <p>为选中的 {{ selectedUsers.length }} 个用户分配角色：</p>
      <el-checkbox-group v-model="batchRoleIds">
        <el-checkbox
          v-for="role in roles"
          :key="role.id"
          :label="role.id"
        >
          {{ role.name }}
        </el-checkbox>
      </el-checkbox-group>

      <template #footer>
        <el-button @click="showBatchRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBatchRoles" :loading="saveLoading">
          分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="用户详情"
      width="800px"
    >
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="用户名">
          {{ currentUser.username }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ currentUser.email }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ currentUser.realName }}
        </el-descriptions-item>
        <el-descriptions-item label="电话">
          {{ currentUser.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="部门">
          {{ currentUser.department }}
        </el-descriptions-item>
        <el-descriptions-item label="职位">
          {{ currentUser.position }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentUser.status === 'active' ? 'success' : 'danger'">
            {{ currentUser.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后登录">
          {{ formatDateTime(currentUser.lastLoginAt) || '从未登录' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(currentUser.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDateTime(currentUser.updatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="角色" :span="2">
          <el-tag
            v-for="role in currentUser.roles"
            :key="role.id"
            type="primary"
            style="margin-right: 5px"
          >
            {{ role.name }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentUser.remark || '无' }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 活动日志对话框 -->
    <el-dialog
      v-model="showActivityDialog"
      title="用户活动日志"
      width="800px"
    >
      <el-table :data="activityLogs" v-loading="activityLoading">
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="resource" label="资源" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="ipAddress" label="IP地址" width="130" />
        <el-table-column prop="userAgent" label="用户代理" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="showActivityDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload } from '@element-plus/icons-vue'
import { userAPI } from '@/api/users'
import { roleAPI } from '@/api/permissions'
import { formatDateTime } from '@/utils/date'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const saveLoading = ref(false)
const exportLoading = ref(false)
const activityLoading = ref(false)

const users = ref([])
const roles = ref([])
const selectedUsers = ref([])
const activityLogs = ref([])

const showCreateDialog = ref(false)
const showRoleDialog = ref(false)
const showBatchRoleDialog = ref(false)
const showDetailDialog = ref(false)
const showActivityDialog = ref(false)

const editingUser = ref(null)
const currentUser = ref(null)
const selectedRoleIds = ref([])
const batchRoleIds = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  roleId: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 用户表单
const userForm = reactive({
  username: '',
  email: '',
  realName: '',
  phone: '',
  password: '',
  confirmPassword: '',
  roleIds: [],
  department: '',
  position: '',
  status: 'active',
  remark: ''
})

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const userFormRef = ref()

// 方法
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    
    const response = await userAPI.getUsers(params)
    users.value = response.data.list || []
    pagination.total = response.data.total || 0
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const response = await roleAPI.getRoles()
    roles.value = response.data.roles || []
  } catch (error) {
    ElMessage.error('获取角色列表失败')
    console.error('Error fetching roles:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const resetForm = () => {
  editingUser.value = null
  Object.keys(userForm).forEach(key => {
    if (key === 'roleIds') {
      userForm[key] = []
    } else if (key === 'status') {
      userForm[key] = 'active'
    } else {
      userForm[key] = ''
    }
  })
  nextTick(() => {
    userFormRef.value?.clearValidate()
  })
}

const editUser = (user) => {
  editingUser.value = user
  Object.keys(userForm).forEach(key => {
    if (key in user) {
      if (key === 'roleIds') {
        userForm[key] = user.roles?.map(role => role.id) || []
      } else {
        userForm[key] = user[key] || ''
      }
    }
  })
  showCreateDialog.value = true
}

const saveUser = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    saveLoading.value = true
    
    const userData = { ...userForm }
    delete userData.confirmPassword
    
    if (editingUser.value) {
      await userAPI.updateUser(editingUser.value.id, userData)
      ElMessage.success('用户更新成功')
    } else {
      await userAPI.createUser(userData)
      ElMessage.success('用户创建成功')
    }
    
    showCreateDialog.value = false
    fetchUsers()
  } catch (error) {
    if (error.errors) {
      // 表单验证失败
      return
    }
    ElMessage.error(editingUser.value ? '用户更新失败' : '用户创建失败')
    console.error('Error saving user:', error)
  } finally {
    saveLoading.value = false
  }
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userAPI.deleteUser(user.id)
    ElMessage.success('用户删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('用户删除失败')
      console.error('Error deleting user:', error)
    }
  }
}

const toggleUserStatus = async (user) => {
  try {
    const enabled = user.status === 'active'
    await userAPI.toggleUserStatus(user.id, enabled)
    ElMessage.success(`用户${enabled ? '启用' : '禁用'}成功`)
  } catch (error) {
    // 恢复原状态
    user.status = user.status === 'active' ? 'inactive' : 'active'
    ElMessage.error('状态更新失败')
    console.error('Error toggling user status:', error)
  }
}

const manageRoles = async (user) => {
  currentUser.value = user
  selectedRoleIds.value = user.roles?.map(role => role.id) || []
  showRoleDialog.value = true
}

const configurePermissions = (user) => {
  router.push({
    name: 'UserPermissions',
    query: { userId: user.id }
  })
}

const batchConfigurePermissions = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要配置权限的用户')
    return
  }
  
  // 将选中的用户ID传递给权限配置页面
  const userIds = selectedUsers.value.map(user => user.id).join(',')
  router.push({
    name: 'UserPermissions',
    query: { userIds }
  })
}

const saveUserRoles = async () => {
  try {
    saveLoading.value = true
    await userAPI.assignRoles(currentUser.value.id, selectedRoleIds.value)
    ElMessage.success('角色分配成功')
    showRoleDialog.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error('角色分配失败')
    console.error('Error assigning roles:', error)
  } finally {
    saveLoading.value = false
  }
}

const batchUpdateStatus = async (enabled) => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要操作的用户')
    return
  }
  
  try {
    const userIds = selectedUsers.value.map(user => user.id)
    await userAPI.batchUpdateStatus(userIds, enabled)
    ElMessage.success(`批量${enabled ? '启用' : '禁用'}成功`)
    fetchUsers()
  } catch (error) {
    ElMessage.error(`批量${enabled ? '启用' : '禁用'}失败`)
    console.error('Error batch updating status:', error)
  }
}

const batchDelete = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要删除的用户')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const userIds = selectedUsers.value.map(user => user.id)
    await userAPI.batchDeleteUsers(userIds)
    ElMessage.success('批量删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
      console.error('Error batch deleting users:', error)
    }
  }
}

const saveBatchRoles = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要操作的用户')
    return
  }
  
  try {
    saveLoading.value = true
    const userIds = selectedUsers.value.map(user => user.id)
    await userAPI.batchAssignRoles(userIds, batchRoleIds.value)
    ElMessage.success('批量角色分配成功')
    showBatchRoleDialog.value = false
    batchRoleIds.value = []
    fetchUsers()
  } catch (error) {
    ElMessage.error('批量角色分配失败')
    console.error('Error batch assigning roles:', error)
  } finally {
    saveLoading.value = false
  }
}

const viewUser = (user) => {
  currentUser.value = user
  showDetailDialog.value = true
}

const viewActivity = async (user) => {
  currentUser.value = user
  activityLoading.value = true
  showActivityDialog.value = true
  
  try {
    const response = await userAPI.getUserActivityLogs(user.id)
    activityLogs.value = response.data || []
  } catch (error) {
    ElMessage.error('获取活动日志失败')
    console.error('Error fetching activity logs:', error)
  } finally {
    activityLoading.value = false
  }
}

const resetPassword = async (user) => {
  try {
    const { value: newPassword } = await ElMessageBox.prompt(
      '请输入新密码',
      '重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'password',
        inputValidator: (value) => {
          if (!value || value.length < 6) {
            return '密码长度不能少于6位'
          }
          return true
        }
      }
    )
    
    await userAPI.resetPassword(user.id, newPassword)
    ElMessage.success('密码重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('密码重置失败')
      console.error('Error resetting password:', error)
    }
  }
}

const handleExport = async () => {
  try {
    exportLoading.value = true
    await userAPI.exportUsers(searchForm)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('Error exporting users:', error)
  } finally {
    exportLoading.value = false
  }
}

const handleImport = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    await userAPI.importUsers(formData)
    ElMessage.success('导入成功')
    fetchUsers()
  } catch (error) {
    ElMessage.error('导入失败')
    console.error('Error importing users:', error)
  }
  
  return false // 阻止自动上传
}

// 生命周期
onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.users-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-avatar) {
  background-color: #409EFF;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}
</style>