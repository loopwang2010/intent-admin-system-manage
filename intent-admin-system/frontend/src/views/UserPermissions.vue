<template>
  <div class="user-permissions-page">
    <div class="page-header">
      <h2>用户权限管理</h2>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/users' }">用户管理</el-breadcrumb-item>
        <el-breadcrumb-item>权限配置</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 用户选择 -->
    <el-card class="user-selector-card" v-if="!selectedUser">
      <template #header>
        <span>选择用户</span>
      </template>
      
      <div class="user-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名、邮箱或姓名"
          style="width: 300px"
          @input="searchUsers"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="user-list" v-loading="userLoading">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="user-item"
          @click="selectUser(user)"
        >
          <el-avatar :src="user.avatar" :alt="user.username">
            {{ user.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-info">
            <div class="user-name">{{ user.realName || user.username }}</div>
            <div class="user-email">{{ user.email }}</div>
            <div class="user-roles">
              <el-tag
                v-for="role in user.roles"
                :key="role.id"
                size="small"
                type="primary"
              >
                {{ role.name }}
              </el-tag>
            </div>
          </div>
          <div class="user-status">
            <el-tag :type="user.status === 'active' ? 'success' : 'danger'" size="small">
              {{ user.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </div>
        
        <el-empty v-if="filteredUsers.length === 0" description="未找到用户" />
      </div>
    </el-card>

    <!-- 权限管理 -->
    <div v-if="selectedUser" class="permission-management">
      <el-card class="back-card">
        <el-button @click="backToUserList">
          <el-icon><ArrowLeft /></el-icon>
          返回用户列表
        </el-button>
      </el-card>

      <UserPermissionManager
        :user="selectedUser"
        @permission-updated="handlePermissionUpdated"
      />
    </div>

    <!-- 批量权限管理对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量权限管理"
      width="800px"
    >
      <div class="batch-users">
        <h4>选中用户 ({{ batchUsers.length }})</h4>
        <div class="batch-user-list">
          <el-tag
            v-for="user in batchUsers"
            :key="user.id"
            closable
            @close="removeBatchUser(user)"
          >
            {{ user.realName || user.username }}
          </el-tag>
        </div>
      </div>

      <el-divider />

      <el-tabs v-model="batchActiveTab">
        <el-tab-pane label="批量分配角色" name="roles">
          <el-checkbox-group v-model="batchSelectedRoles">
            <el-checkbox
              v-for="role in availableRoles"
              :key="role.id"
              :label="role.id"
            >
              {{ role.name }} - {{ role.description }}
            </el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        
        <el-tab-pane label="批量分配权限" name="permissions">
          <el-tree
            ref="batchPermissionTreeRef"
            :data="permissionTree"
            :props="{ label: 'name', children: 'children' }"
            show-checkbox
            node-key="id"
          />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBatchPermissions" :loading="batchSaving">
          批量分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ArrowLeft } from '@element-plus/icons-vue'
import UserPermissionManager from '@/components/UserPermissionManager.vue'
import { userAPI } from '@/api/users'
import { roleAPI, permissionAPI } from '@/api/permissions'

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const userLoading = ref(false)
const batchSaving = ref(false)
const searchKeyword = ref('')
const selectedUser = ref(null)

const users = ref([])
const availableRoles = ref([])
const permissionTree = ref([])

const showBatchDialog = ref(false)
const batchUsers = ref([])
const batchActiveTab = ref('roles')
const batchSelectedRoles = ref([])

const batchPermissionTreeRef = ref()

// 计算属性
const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return users.value.filter(user => {
    return (
      user.username?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.realName?.toLowerCase().includes(keyword)
    )
  })
})

// 方法
const fetchUsers = async () => {
  userLoading.value = true
  try {
    const response = await userAPI.getUsers({ size: 1000 }) // 获取所有用户
    users.value = response.data.list || []
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    console.error('Error fetching users:', error)
  } finally {
    userLoading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const response = await roleAPI.getRoles()
    availableRoles.value = response.data.roles || []
  } catch (error) {
    ElMessage.error('获取角色列表失败')
    console.error('Error fetching roles:', error)
  }
}

const fetchPermissions = async () => {
  try {
    const response = await permissionAPI.getPermissions()
    permissionTree.value = buildPermissionTree(response.data || [])
  } catch (error) {
    ElMessage.error('获取权限列表失败')
    console.error('Error fetching permissions:', error)
  }
}

const buildPermissionTree = (permissions) => {
  const tree = []
  const map = new Map()
  
  // 创建映射
  permissions.forEach(permission => {
    map.set(permission.id, { ...permission, children: [] })
  })
  
  // 构建树结构
  permissions.forEach(permission => {
    const node = map.get(permission.id)
    if (permission.parentId && map.has(permission.parentId)) {
      map.get(permission.parentId).children.push(node)
    } else {
      tree.push(node)
    }
  })
  
  return tree
}

const searchUsers = () => {
  // 搜索逻辑已在计算属性中处理
}

const selectUser = (user) => {
  selectedUser.value = user
  // 更新URL，但不导航
  router.push({ 
    name: 'UserPermissions', 
    query: { userId: user.id } 
  })
}

const backToUserList = () => {
  selectedUser.value = null
  router.push({ name: 'UserPermissions' })
}

const handlePermissionUpdated = (permissionData) => {
  ElMessage.success('用户权限更新成功')
  
  // 更新本地用户数据
  const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id)
  if (userIndex !== -1) {
    users.value[userIndex].roles = permissionData.roles
  }
}

const openBatchDialog = (selectedUsers) => {
  batchUsers.value = [...selectedUsers]
  showBatchDialog.value = true
}

const removeBatchUser = (user) => {
  const index = batchUsers.value.findIndex(u => u.id === user.id)
  if (index !== -1) {
    batchUsers.value.splice(index, 1)
  }
}

const saveBatchPermissions = async () => {
  if (batchUsers.value.length === 0) {
    ElMessage.warning('请选择要操作的用户')
    return
  }

  try {
    batchSaving.value = true
    const userIds = batchUsers.value.map(user => user.id)

    if (batchActiveTab.value === 'roles') {
      if (batchSelectedRoles.value.length === 0) {
        ElMessage.warning('请选择要分配的角色')
        return
      }
      
      await userAPI.batchAssignRoles(userIds, batchSelectedRoles.value)
      ElMessage.success('批量角色分配成功')
    } else if (batchActiveTab.value === 'permissions') {
      const checkedKeys = batchPermissionTreeRef.value?.getCheckedKeys() || []
      if (checkedKeys.length === 0) {
        ElMessage.warning('请选择要分配的权限')
        return
      }
      
      // 批量分配直接权限（需要后端支持）
      for (const userId of userIds) {
        await userAPI.assignDirectPermissions(userId, checkedKeys)
      }
      ElMessage.success('批量权限分配成功')
    }

    showBatchDialog.value = false
    batchUsers.value = []
    batchSelectedRoles.value = []
    fetchUsers() // 刷新用户列表
  } catch (error) {
    ElMessage.error('批量操作失败')
    console.error('Error in batch operation:', error)
  } finally {
    batchSaving.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchUsers()
  fetchRoles()
  fetchPermissions()
  
  // 如果URL中有userId参数，自动选择该用户
  const userId = route.query.userId
  if (userId) {
    const user = users.value.find(u => u.id === parseInt(userId))
    if (user) {
      selectedUser.value = user
    }
  }
})

// 暴露方法给父组件
defineExpose({
  openBatchDialog
})
</script>

<style scoped>
.user-permissions-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.user-selector-card {
  margin-bottom: 20px;
}

.user-search {
  margin-bottom: 20px;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.user-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.user-info {
  flex: 1;
  margin-left: 15px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.user-email {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.user-roles {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.user-status {
  margin-left: 15px;
}

.back-card {
  margin-bottom: 20px;
}

.permission-management {
  margin-top: 20px;
}

.batch-users {
  margin-bottom: 20px;
}

.batch-users h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.batch-user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.el-tree) {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}
</style>