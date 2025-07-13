<template>
  <div class="permission-management">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 角色管理 -->
      <el-tab-pane label="角色管理" name="roles">
        <div class="tab-header">
          <h3>角色管理</h3>
          <el-button type="primary" @click="showCreateRoleDialog = true">
            创建角色
          </el-button>
        </div>

        <el-card>
          <el-table :data="roles" v-loading="rolesLoading" stripe>
            <el-table-column label="角色" width="200">
              <template #default="{ row }">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-icon :style="{ color: row.color || '#666', fontSize: '16px' }">
                    <component :is="getIconComponent(row.icon)" />
                  </el-icon>
                  <div>
                    <div style="font-weight: 500;">{{ row.name }}</div>
                    <div style="font-size: 12px; color: #999;">{{ row.code }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="level" label="级别" width="80" />
            <el-table-column prop="isSystem" label="系统角色" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isSystem ? 'warning' : 'success'">
                  {{ row.isSystem ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="text" size="small" @click="viewRolePermissions(row)">
                  查看权限
                </el-button>
                <el-button type="text" size="small" @click="editRole(row)" v-if="!row.isSystem">
                  编辑
                </el-button>
                <el-button type="text" size="small" @click="copyRole(row)">
                  复制
                </el-button>
                <el-button 
                  type="text" 
                  size="small" 
                  style="color: #f56c6c" 
                  @click="deleteRole(row)"
                  v-if="!row.isSystem"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 权限管理 -->
      <el-tab-pane label="权限管理" name="permissions">
        <div class="tab-header">
          <h3>权限管理</h3>
          <div class="permission-filters">
            <el-select v-model="permissionFilter" placeholder="按分类筛选" clearable>
              <el-option
                v-for="category in permissionCategories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </div>
        </div>

        <el-card>
          <div class="permission-tree">
            <el-tree
              :data="filteredPermissions"
              :props="treeProps"
              node-key="code"
              default-expand-all
              class="permission-tree-component"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <div class="node-content">
                    <span class="node-label">{{ data.name }}</span>
                    <el-tag size="small" :type="getLevelColor(data.level)">
                      L{{ data.level }}
                    </el-tag>
                  </div>
                  <div class="node-description">
                    {{ data.description }}
                  </div>
                  <div class="node-meta" v-if="data.dependencies?.length">
                    <span class="dependencies">
                      依赖: {{ data.dependencies.join(', ') }}
                    </span>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 用户角色分配 -->
      <el-tab-pane label="用户角色" name="user-roles">
        <div class="tab-header">
          <h3>用户角色分配</h3>
          <el-input
            v-model="userSearchKeyword"
            placeholder="搜索用户"
            style="width: 300px"
            @input="searchUsers"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-card>
          <el-table :data="usersWithRoles" v-loading="usersLoading" stripe>
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="email" label="邮箱" width="200" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '活跃' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="当前角色" min-width="200">
              <template #default="{ row }">
                <div class="user-roles">
                  <el-tag
                    v-for="role in row.roles"
                    :key="role.id"
                    :type="role.isPrimary ? 'primary' : 'info'"
                    size="small"
                    style="margin-right: 5px"
                  >
                    {{ role.name }}
                    <span v-if="role.isPrimary">（主要）</span>
                  </el-tag>
                  <el-tag v-if="!row.roles?.length" type="warning" size="small">
                    无角色
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginAt" label="最后登录" width="160">
              <template #default="{ row }">
                {{ row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '从未登录' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="text" size="small" @click="manageUserRoles(row)">
                  管理角色
                </el-button>
                <el-button type="text" size="small" @click="viewUserPermissions(row)">
                  查看权限
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      v-model="showCreateRoleDialog"
      :title="editingRole ? '编辑角色' : '创建角色'"
      width="800px"
    >
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色代码" prop="code">
              <el-input v-model="roleForm.code" :disabled="!!editingRole" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="name">
              <el-input v-model="roleForm.name" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" rows="3" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="级别" prop="level">
              <el-input-number v-model="roleForm.level" :min="1" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="颜色">
              <el-color-picker v-model="roleForm.color" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="权限分配">
          <div class="permission-assignment">
            <el-tree
              ref="permissionTreeRef"
              :data="permissions"
              :props="treeProps"
              show-checkbox
              node-key="code"
              :default-checked-keys="roleForm.permissionIds"
              class="permission-tree-component"
            >
              <template #default="{ node, data }">
                <div class="tree-node-simple">
                  <span>{{ data.name }}</span>
                  <el-tag size="small" :type="getLevelColor(data.level)">
                    L{{ data.level }}
                  </el-tag>
                </div>
              </template>
            </el-tree>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelRoleEdit">取消</el-button>
        <el-button type="primary" @click="saveRole" :loading="roleSubmitting">
          {{ editingRole ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户角色管理对话框 -->
    <el-dialog
      v-model="showUserRoleDialog"
      title="管理用户角色"
      width="600px"
    >
      <div v-if="selectedUser">
        <h4>用户: {{ selectedUser.username }}</h4>
        
        <el-form :model="userRoleForm" label-width="100px">
          <el-form-item label="选择角色">
            <el-select 
              v-model="userRoleForm.roleIds" 
              multiple 
              placeholder="选择角色"
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
          
          <el-form-item label="主要角色">
            <el-select 
              v-model="userRoleForm.primaryRoleId" 
              placeholder="选择主要角色"
              style="width: 100%"
            >
              <el-option
                v-for="roleId in userRoleForm.roleIds"
                :key="roleId"
                :label="roles.find(r => r.id === roleId)?.name"
                :value="roleId"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="分配原因">
            <el-input 
              v-model="userRoleForm.reason" 
              type="textarea" 
              rows="3"
              placeholder="说明角色分配的原因..."
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showUserRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="updateUserRoles" :loading="userRoleSubmitting">
          更新角色
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限查看对话框 -->
    <el-dialog
      v-model="showPermissionDialog"
      :title="permissionDialogTitle"
      width="600px"
    >
      <div class="permission-list">
        <el-tree
          :data="userPermissionTree"
          :props="{ label: 'name', children: 'children' }"
          default-expand-all
        >
          <template #default="{ node, data }">
            <div class="permission-item">
              <span>{{ data.name }}</span>
              <el-tag size="small" type="success" v-if="data.source">
                {{ data.source }}
              </el-tag>
            </div>
          </template>
        </el-tree>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User, Avatar, Edit, View, Lock, Star, Tools } from '@element-plus/icons-vue'
import { roleAPI, permissionAPI } from '@/api/permissions'
import { formatDateTime } from '@/utils/date'

// 响应式数据
const activeTab = ref('roles')
const rolesLoading = ref(false)
const usersLoading = ref(false)
const roleSubmitting = ref(false)
const userRoleSubmitting = ref(false)

const roles = ref([])
const permissions = ref([])
const usersWithRoles = ref([])
const permissionCategories = ref([])

const showCreateRoleDialog = ref(false)
const showUserRoleDialog = ref(false)
const showPermissionDialog = ref(false)

const editingRole = ref(null)
const selectedUser = ref(null)
const permissionDialogTitle = ref('')
const userPermissionTree = ref([])

const userSearchKeyword = ref('')
const permissionFilter = ref('')

// 表单数据
const roleForm = reactive({
  code: '',
  name: '',
  description: '',
  level: 1,
  color: '#409EFF',
  icon: '',
  permissionIds: []
})

const userRoleForm = reactive({
  roleIds: [],
  primaryRoleId: null,
  reason: ''
})

// 表单验证规则
const roleRules = {
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '角色代码只能包含小写字母和下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' }
  ],
  level: [
    { required: true, message: '请设置角色级别', trigger: 'blur' }
  ]
}

// 树形组件配置
const treeProps = {
  label: 'name',
  children: 'children'
}

// 引用
const roleFormRef = ref()
const permissionTreeRef = ref()

// 计算属性
const filteredPermissions = computed(() => {
  if (!permissionFilter.value) {
    return permissions.value
  }
  
  const filterPermissions = (items) => {
    return items.filter(item => {
      if (item.category === permissionFilter.value) {
        return true
      }
      if (item.children) {
        const filteredChildren = filterPermissions(item.children)
        if (filteredChildren.length > 0) {
          return true
        }
      }
      return false
    }).map(item => ({
      ...item,
      children: item.children ? filterPermissions(item.children) : undefined
    }))
  }
  
  return filterPermissions(permissions.value)
})

// 方法
const fetchRoles = async () => {
  rolesLoading.value = true
  try {
    const response = await roleAPI.getRoles()
    roles.value = response.data.roles || []
  } catch (error) {
    ElMessage.error('获取角色列表失败')
    console.error('Error fetching roles:', error)
  } finally {
    rolesLoading.value = false
  }
}

const fetchPermissions = async () => {
  try {
    const response = await permissionAPI.getPermissions()
    const permissionList = response.data.permissions || []
    
    // 将权限列表转换为树形结构
    permissions.value = buildPermissionTree(permissionList)
    
    // 提取分类
    permissionCategories.value = [...new Set(permissionList.map(p => p.category))]
  } catch (error) {
    ElMessage.error('获取权限列表失败')
    console.error('Error fetching permissions:', error)
  }
}

const fetchUsersWithRoles = async (keyword = '') => {
  usersLoading.value = true
  try {
    // 这里需要一个获取用户及其角色的API
    // 暂时模拟数据
    const response = { data: { users: [] } }
    usersWithRoles.value = response.data.users || []
  } catch (error) {
    ElMessage.error('获取用户角色信息失败')
    console.error('Error fetching users with roles:', error)
  } finally {
    usersLoading.value = false
  }
}

const buildPermissionTree = (permissionList) => {
  const categoryMap = {}
  
  permissionList.forEach(permission => {
    if (!categoryMap[permission.category]) {
      categoryMap[permission.category] = {
        name: permission.category,
        code: permission.category,
        children: []
      }
    }
    categoryMap[permission.category].children.push(permission)
  })
  
  return Object.values(categoryMap)
}

const editRole = (role) => {
  editingRole.value = role
  Object.assign(roleForm, {
    code: role.code,
    name: role.name,
    description: role.description,
    level: role.level,
    color: role.color || '#409EFF',
    icon: role.icon || '',
    permissionIds: role.permissions?.map(p => p.code) || []
  })
  showCreateRoleDialog.value = true
}

const copyRole = async (role) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新角色的名称',
      '复制角色',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: `${role.name}_副本`,
        inputPattern: /.+/,
        inputErrorMessage: '角色名称不能为空'
      }
    )
    
    const { value: newCode } = await ElMessageBox.prompt(
      '请输入新角色的代码',
      '复制角色',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: `${role.code}_copy`,
        inputPattern: /^[a-z_]+$/,
        inputErrorMessage: '角色代码只能包含小写字母和下划线'
      }
    )
    
    await roleAPI.copyRole(role.id, {
      newCode,
      newName,
      newDescription: `复制自 ${role.name}`
    })
    
    ElMessage.success('角色复制成功')
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('角色复制失败')
      console.error('Error copying role:', error)
    }
  }
}

const deleteRole = async (role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？此操作不可撤销。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    await roleAPI.deleteRole(role.id)
    ElMessage.success('角色删除成功')
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('角色删除失败')
      console.error('Error deleting role:', error)
    }
  }
}

const saveRole = async () => {
  try {
    await roleFormRef.value.validate()
    
    roleSubmitting.value = true
    
    // 获取选中的权限
    const checkedPermissions = permissionTreeRef.value.getCheckedKeys()
    const formData = {
      ...roleForm,
      permissionIds: checkedPermissions
    }
    
    if (editingRole.value) {
      await roleAPI.updateRole(editingRole.value.id, formData)
      ElMessage.success('角色更新成功')
    } else {
      await roleAPI.createRole(formData)
      ElMessage.success('角色创建成功')
    }
    
    cancelRoleEdit()
    fetchRoles()
  } catch (error) {
    ElMessage.error(editingRole.value ? '角色更新失败' : '角色创建失败')
    console.error('Error saving role:', error)
  } finally {
    roleSubmitting.value = false
  }
}

const cancelRoleEdit = () => {
  showCreateRoleDialog.value = false
  editingRole.value = null
  Object.assign(roleForm, {
    code: '',
    name: '',
    description: '',
    level: 1,
    color: '#409EFF',
    icon: '',
    permissionIds: []
  })
  roleFormRef.value?.resetFields()
}

const manageUserRoles = async (user) => {
  selectedUser.value = user
  
  try {
    const response = await roleAPI.getUserRoles(user.id)
    const userRoles = response.data.roles || []
    
    userRoleForm.roleIds = userRoles.map(ur => ur.roleId)
    userRoleForm.primaryRoleId = userRoles.find(ur => ur.isPrimary)?.roleId || null
    userRoleForm.reason = ''
    
    showUserRoleDialog.value = true
  } catch (error) {
    ElMessage.error('获取用户角色失败')
    console.error('Error fetching user roles:', error)
  }
}

const updateUserRoles = async () => {
  try {
    userRoleSubmitting.value = true
    
    await roleAPI.assignRoleToUser(selectedUser.value.id, {
      roleIds: userRoleForm.roleIds,
      isPrimary: userRoleForm.primaryRoleId,
      reason: userRoleForm.reason
    })
    
    ElMessage.success('用户角色更新成功')
    showUserRoleDialog.value = false
    fetchUsersWithRoles()
  } catch (error) {
    ElMessage.error('用户角色更新失败')
    console.error('Error updating user roles:', error)
  } finally {
    userRoleSubmitting.value = false
  }
}

// 图标组件映射
const getIconComponent = (iconName) => {
  const iconMap = {
    'crown': Star,
    'user-tie': Avatar,
    'edit': Edit,
    'eye': View,
    'bug': User,
    'users': User,
    'lock': Lock,
    'shield': Lock
  }
  return iconMap[iconName] || User
}

const viewRolePermissions = async (role) => {
  try {
    const response = await roleAPI.getRoleById(role.id)
    const roleData = response.data
    
    permissionDialogTitle.value = `角色权限 - ${role.name}`
    userPermissionTree.value = buildUserPermissionTree(
      roleData.permissions || [],
      'role'
    )
    showPermissionDialog.value = true
  } catch (error) {
    ElMessage.error('获取角色权限失败')
    console.error('Error fetching role permissions:', error)
  }
}

const viewUserPermissions = async (user) => {
  try {
    const response = await permissionAPI.getUserPermissions(user.id)
    const userPermissions = response.data.permissions || []
    
    permissionDialogTitle.value = `用户权限 - ${user.username}`
    userPermissionTree.value = buildUserPermissionTree(
      userPermissions,
      'user'
    )
    showPermissionDialog.value = true
  } catch (error) {
    ElMessage.error('获取用户权限失败')
    console.error('Error fetching user permissions:', error)
  }
}

const buildUserPermissionTree = (permissions, source) => {
  const categoryMap = {}
  
  permissions.forEach(permission => {
    if (!categoryMap[permission.category]) {
      categoryMap[permission.category] = {
        name: permission.category,
        children: []
      }
    }
    categoryMap[permission.category].children.push({
      ...permission,
      source: source === 'role' ? '角色授权' : '直接授权'
    })
  })
  
  return Object.values(categoryMap)
}

const searchUsers = (keyword) => {
  fetchUsersWithRoles(keyword)
}

const getLevelColor = (level) => {
  if (level <= 1) return 'success'
  if (level <= 3) return 'primary'
  if (level <= 4) return 'warning'
  return 'danger'
}

// 生命周期
onMounted(() => {
  fetchRoles()
  fetchPermissions()
  fetchUsersWithRoles()
})
</script>

<style scoped>
.permission-management {
  padding: 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tab-header h3 {
  margin: 0;
  color: #303133;
}

.permission-filters {
  display: flex;
  gap: 10px;
}

.permission-tree {
  max-height: 600px;
  overflow-y: auto;
}

.tree-node {
  flex: 1;
  padding: 5px 0;
}

.tree-node-simple {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.node-label {
  font-weight: 500;
  color: #303133;
}

.node-description {
  font-size: 12px;
  color: #909399;
  margin-bottom: 3px;
}

.node-meta {
  font-size: 11px;
  color: #C0C4CC;
}

.dependencies {
  font-style: italic;
}

.user-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.permission-assignment {
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

.permission-list {
  max-height: 400px;
  overflow-y: auto;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

:deep(.el-tabs--border-card) {
  border: none;
  box-shadow: none;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 8px 0;
}

:deep(.el-tree-node__expand-icon) {
  color: #409EFF;
}
</style>