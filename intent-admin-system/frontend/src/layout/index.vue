<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <div 
      class="layout-sidebar"
      :style="{ width: sidebarCollapsed ? '64px' : '240px' }"
    >
      <div class="sidebar-logo">
        <h3 v-if="!sidebarCollapsed">智能音箱意图管理</h3>
        <h3 v-if="sidebarCollapsed">意图</h3>
      </div>
      
      <div class="sidebar-menu">
        <div class="menu-item" @click="goToRoute('/dashboard')">
          <span class="menu-icon">📊</span>
          <span v-if="!sidebarCollapsed" class="menu-text">仪表板</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/categories')">
          <span class="menu-icon">📁</span>
          <span v-if="!sidebarCollapsed" class="menu-text">意图分类</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/cascading-categories')">
          <span class="menu-icon">🗂️</span>
          <span v-if="!sidebarCollapsed" class="menu-text">级联分类管理</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/core-intents')">
          <span class="menu-icon">⭐</span>
          <span v-if="!sidebarCollapsed" class="menu-text">核心意图</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/non-core-intents')">
          <span class="menu-icon">📋</span>
          <span v-if="!sidebarCollapsed" class="menu-text">非核心意图</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/pre-responses')">
          <span class="menu-icon">💬</span>
          <span v-if="!sidebarCollapsed" class="menu-text">回复模板</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/intent-test')">
          <span class="menu-icon">🧪</span>
          <span v-if="!sidebarCollapsed" class="menu-text">意图测试</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/analytics')">
          <span class="menu-icon">📈</span>
          <span v-if="!sidebarCollapsed" class="menu-text">数据分析</span>
        </div>
        
        <div class="menu-item" @click="goToRoute('/users')">
          <span class="menu-icon">👥</span>
          <span v-if="!sidebarCollapsed" class="menu-text">用户管理</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="layout-main">
      <!-- 头部 -->
      <div class="layout-header">
        <div class="header-left">
          <button class="toggle-btn" @click="toggleSidebar">
            <span>☰</span>
          </button>
          
          <!-- 面包屑 -->
          <div class="breadcrumb">
            <span>首页</span>
            <span v-if="routeTitle"> / {{ routeTitle }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <!-- 用户菜单 -->
          <div class="user-menu" @click="toggleUserMenu">
            <div class="user-avatar">
              <span>{{ userInitial }}</span>
            </div>
            <span class="username">{{ username }}</span>
            
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="dropdown-item" @click="goToProfile">个人资料</div>
              <div class="dropdown-item" @click="logout">退出登录</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="layout-content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)
const showUserMenu = ref(false)

const userInitial = computed(() => {
  return authStore.user?.username?.charAt(0)?.toUpperCase() || 'A'
})

const username = computed(() => {
  return authStore.user?.username || 'admin'
})

const routeTitle = computed(() => {
  return route.meta?.title || ''
})

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const goToRoute = (path) => {
  router.push(path)
}

const goToProfile = () => {
  showUserMenu.value = false
  router.push('/profile')
}

const logout = () => {
  showUserMenu.value = false
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
}

.layout-sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #409eff;
  padding: 0 16px;
}

.sidebar-logo h3 {
  margin: 0;
  font-size: 16px;
}

.sidebar-menu {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 4px;
  margin: 2px 8px;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-icon {
  font-size: 18px;
  margin-right: 12px;
  min-width: 18px;
}

.menu-text {
  font-size: 14px;
  color: #303133;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.toggle-btn:hover {
  background-color: #f5f7fa;
}

.breadcrumb {
  font-size: 14px;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-menu:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.username {
  font-size: 14px;
  color: #303133;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #303133;
  transition: background-color 0.3s;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.layout-content {
  flex: 1;
  background: #f5f7fa;
  overflow: auto;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-sidebar {
    position: absolute;
    z-index: 1000;
    height: 100%;
  }
  
  .breadcrumb {
    display: none;
  }
  
  .username {
    display: none;
  }
}
</style>