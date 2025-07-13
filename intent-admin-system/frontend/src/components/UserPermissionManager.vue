<template>
  <div class="user-permission-manager">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户权限配置</span>
          <el-button type="primary" size="small" @click="savePermissions" :loading="saving">
            <el-icon><Check /></el-icon>
            保存权限
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 用户信息 -->
        <el-col :span="8">
          <el-card shadow="never" class="user-info-card">
            <div class="user-avatar">
              <el-avatar :size="80" :src="user.avatar">
                {{ user.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
            </div>
            <div class="user-details">
              <h3>{{ user.realName || user.username }}</h3>
              <p class="user-email">{{ user.email }}</p>
              <el-tag :type="user.status === 'active' ? 'success' : 'danger'">
                {{ user.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </el-card>

          <!-- 当前角色 -->
          <el-card shadow="never" class="current-roles-card">
            <template #header>
              <span>当前角色</span>
            </template>
            <div v-if="user.roles?.length > 0">
              <el-tag
                v-for="role in user.roles"
                :key="role.id"
                type="primary"
                class="role-tag"
              >
                {{ role.name }}
              </el-tag>
            </div>
            <el-empty v-else description="暂无分配角色" :image-size="60" />
          </el-card>
        </el-col>

        <!-- 权限配置 -->
        <el-col :span="16">
          <el-tabs v-model="activeTab" type="border-card">
            <!-- 角色分配 -->
            <el-tab-pane label="角色分配" name="roles">
              <div class="roles-section">
                <div class="section-header">
                  <h4>可分配角色</h4>
                  <el-button type="text" @click="selectAllRoles">全选</el-button>
                  <el-button type="text" @click="clearAllRoles">清空</el-button>
                </div>
                
                <el-checkbox-group v-model="selectedRoleIds" class="role-group">
                  <div v-for="role in availableRoles" :key="role.id" class="role-item">
                    <el-checkbox :label="role.id">
                      <div class="role-content">
                        <div class="role-info">
                          <span class="role-name">{{ role.name }}</span>
                          <el-tag size="small" :type="getRoleTypeTag(role.level)">
                            {{ getRoleLevelText(role.level) }}
                          </el-tag>
                        </div>
                        <div class="role-description">
                          {{ role.description }}
                        </div>
                        <div class="role-permissions">
                          <el-tag
                            v-for="permission in role.permissions?.slice(0, 3)"
                            :key="permission.id"
                            size="small"
                            type="info"
                            class="permission-tag"
                          >
                            {{ permission.name }}
                          </el-tag>
                          <span v-if="role.permissions?.length > 3" class="more-permissions">
                            +{{ role.permissions.length - 3 }} 个权限
                          </span>
                        </div>
                      </div>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </el-tab-pane>

            <!-- 直接权限 -->
            <el-tab-pane label="直接权限" name="permissions">
              <div class="permissions-section">
                <el-alert
                  title="直接权限说明"
                  description="直接分配给用户的权限，不依赖于角色。通常用于特殊情况下的权限补充。"
                  type="info"
                  :closable="false"
                  show-icon
                  class="permission-alert"
                />

                <div class="permission-tree">
                  <el-tree
                    ref="permissionTreeRef"
                    :data="permissionTree"
                    :props="{ label: 'name', children: 'children' }"
                    show-checkbox
                    node-key="id"
                    :default-checked-keys="directPermissionIds"
                    :check-strictly="false"
                    @check="handlePermissionCheck"
                  >
                    <template #default="{ node, data }">
                      <div class="tree-node">
                        <span class="node-label">{{ data.name }}</span>
                        <el-tag
                          v-if="data.type"
                          size="small"
                          :type="getPermissionTypeTag(data.type)"
                        >
                          {{ getPermissionTypeText(data.type) }}
                        </el-tag>
                      </div>
                    </template>
                  </el-tree>
                </div>
              </div>
            </el-tab-pane>

            <!-- 权限预览 -->
            <el-tab-pane label="权限预览" name="preview">
              <div class="permissions-preview">
                <el-descriptions title="权限汇总" :column="1" border>
                  <el-descriptions-item label="角色权限">
                    <div class="role-permissions-preview">
                      <div v-for="role in selectedRoles" :key="role.id" class="role-preview">
                        <el-tag type="primary">{{ role.name }}</el-tag>
                        <div class="role-permission-list">
                          <el-tag
                            v-for="permission in role.permissions"
                            :key="permission.id"
                            size="small"
                            type="success"
                          >
                            {{ permission.name }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </el-descriptions-item>
                  
                  <el-descriptions-item label="直接权限">
                    <div class="direct-permissions-preview">
                      <el-tag
                        v-for="permission in selectedDirectPermissions"
                        :key="permission.id"
                        size="small"
                        type="warning"
                      >
                        {{ permission.name }}
                      </el-tag>
                      <span v-if="selectedDirectPermissions.length === 0" class="empty-text">
                        无直接权限
                      </span>
                    </div>
                  </el-descriptions-item>

                  <el-descriptions-item label="最终权限">
                    <div class="final-permissions-preview">
                      <el-tag
                        v-for="permission in finalPermissions"
                        :key="permission.id"
                        size="small"
                        type="primary"
                      >
                        {{ permission.name }}
                      </el-tag>
                    </div>
                  </el-descriptions-item>
                </el-descriptions>

                <!-- 权限统计 -->
                <el-row :gutter="20" class="permission-stats">
                  <el-col :span="8">
                    <el-statistic title="角色权限数" :value="rolePermissionsCount" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="直接权限数" :value="directPermissionsCount" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="总权限数" :value="totalPermissionsCount" />
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { userAPI } from '@/api/users'
import { roleAPI, permissionAPI } from '@/api/permissions'

// Props
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['permission-updated'])

// 响应式数据
const saving = ref(false)
const activeTab = ref('roles')

const availableRoles = ref([])
const permissionTree = ref([])
const selectedRoleIds = ref([])
const directPermissionIds = ref([])

const permissionTreeRef = ref()

// 计算属性
const selectedRoles = computed(() => {
  return availableRoles.value.filter(role => selectedRoleIds.value.includes(role.id))
})

const selectedDirectPermissions = computed(() => {
  const allPermissions = flattenPermissions(permissionTree.value)
  return allPermissions.filter(permission => directPermissionIds.value.includes(permission.id))
})

const finalPermissions = computed(() => {
  const rolePermissions = selectedRoles.value.flatMap(role => role.permissions || [])
  const directPermissions = selectedDirectPermissions.value
  
  // 去重合并
  const permissionMap = new Map()
  
  rolePermissions.forEach(permission => {
    permissionMap.set(permission.id, permission)
  })
  
  directPermissions.forEach(permission => {
    permissionMap.set(permission.id, permission)
  })
  
  return Array.from(permissionMap.values())
})

const rolePermissionsCount = computed(() => {
  return selectedRoles.value.reduce((count, role) => count + (role.permissions?.length || 0), 0)
})

const directPermissionsCount = computed(() => {
  return selectedDirectPermissions.value.length
})

const totalPermissionsCount = computed(() => {
  return finalPermissions.value.length
})

// 方法
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

const fetchUserPermissions = async () => {
  try {
    // 获取用户当前角色
    selectedRoleIds.value = props.user.roles?.map(role => role.id) || []
    
    // 获取用户直接权限
    const response = await userAPI.getUserPermissions(props.user.id)
    directPermissionIds.value = response.data?.directPermissions?.map(p => p.id) || []
  } catch (error) {
    ElMessage.error('获取用户权限失败')
    console.error('Error fetching user permissions:', error)
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

const flattenPermissions = (tree) => {
  const result = []
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      result.push(node)
      if (node.children?.length > 0) {
        traverse(node.children)
      }
    })
  }
  
  traverse(tree)
  return result
}

const selectAllRoles = () => {
  selectedRoleIds.value = availableRoles.value.map(role => role.id)
}

const clearAllRoles = () => {
  selectedRoleIds.value = []
}

const handlePermissionCheck = (data, { checkedKeys }) => {
  directPermissionIds.value = checkedKeys
}

const getRoleTypeTag = (level) => {
  const tagMap = {
    1: 'danger',   // 超级管理员
    2: 'warning',  // 管理员
    3: 'primary',  // 普通角色
    4: 'success'   // 访客
  }
  return tagMap[level] || 'info'
}

const getRoleLevelText = (level) => {
  const textMap = {
    1: '超级管理员',
    2: '管理员',
    3: '普通角色',
    4: '访客'
  }
  return textMap[level] || '未知'
}

const getPermissionTypeTag = (type) => {
  const tagMap = {
    'menu': 'primary',
    'button': 'success',
    'api': 'warning',
    'data': 'info'
  }
  return tagMap[type] || 'info'
}

const getPermissionTypeText = (type) => {
  const textMap = {
    'menu': '菜单',
    'button': '按钮',
    'api': '接口',
    'data': '数据'
  }
  return textMap[type] || '未知'
}

const savePermissions = async () => {
  try {
    saving.value = true
    
    // 保存角色分配
    await userAPI.assignRoles(props.user.id, selectedRoleIds.value)
    
    // 保存直接权限
    await userAPI.assignDirectPermissions(props.user.id, directPermissionIds.value)
    
    ElMessage.success('权限配置保存成功')
    emit('permission-updated', {
      roles: selectedRoles.value,
      directPermissions: selectedDirectPermissions.value,
      finalPermissions: finalPermissions.value
    })
  } catch (error) {
    ElMessage.error('权限配置保存失败')
    console.error('Error saving permissions:', error)
  } finally {
    saving.value = false
  }
}

// 监听用户变化
watch(
  () => props.user,
  (newUser) => {
    if (newUser?.id) {
      fetchUserPermissions()
    }
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>

<style scoped>
.user-permission-manager {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info-card {
  margin-bottom: 20px;
  text-align: center;
}

.user-avatar {
  margin-bottom: 15px;
}

.user-details h3 {
  margin: 10px 0 5px 0;
  color: #303133;
}

.user-email {
  color: #909399;
  margin: 5px 0 15px 0;
}

.current-roles-card {
  margin-bottom: 20px;
}

.role-tag {
  margin: 2px 4px;
}

.roles-section {
  padding: 10px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h4 {
  margin: 0;
  color: #303133;
}

.role-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.role-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s;
}

.role-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.role-content {
  margin-left: 24px;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.role-name {
  font-weight: 500;
  color: #303133;
}

.role-description {
  color: #606266;
  font-size: 13px;
  margin-bottom: 10px;
}

.role-permissions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.permission-tag {
  margin: 2px;
}

.more-permissions {
  color: #909399;
  font-size: 12px;
}

.permissions-section {
  padding: 10px 0;
}

.permission-alert {
  margin-bottom: 20px;
}

.permission-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-label {
  flex: 1;
}

.permissions-preview {
  padding: 10px 0;
}

.role-permissions-preview {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.role-preview {
  border-left: 3px solid #409EFF;
  padding-left: 15px;
}

.role-permission-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.direct-permissions-preview,
.final-permissions-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.empty-text {
  color: #909399;
  font-style: italic;
}

.permission-stats {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

:deep(.el-checkbox) {
  width: 100%;
}

:deep(.el-checkbox__label) {
  width: 100%;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 8px 0;
}

:deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
  vertical-align: top;
}
</style>