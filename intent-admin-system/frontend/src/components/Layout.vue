<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="logo">
        <h2 v-if="!collapsed">智能音箱意图管理</h2>
        <h2 v-else>智能</h2>
      </div>
      
      <el-menu
        :default-active="$route.path"
        :collapse="collapsed"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>仪表板</span>
        </el-menu-item>
        
        <el-sub-menu index="intent">
          <template #title>
            <el-icon><Star /></el-icon>
            <span>意图管理</span>
          </template>
          <el-menu-item index="/core-intents">核心意图</el-menu-item>
          <el-menu-item index="/non-core-intents">非核心意图</el-menu-item>
          <el-menu-item index="/categories">意图分类</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/response-templates">
          <el-icon><ChatDotRound /></el-icon>
          <span>首句回复管理</span>
        </el-menu-item>
        
        <el-menu-item index="/test">
          <el-icon><Setting /></el-icon>
          <span>意图测试</span>
        </el-menu-item>
        
        <el-menu-item index="/data-insights">
          <el-icon><TrendCharts /></el-icon>
          <span>数据洞察</span>
        </el-menu-item>
        
        <el-menu-item index="/enhanced-test">
          <el-icon><Setting /></el-icon>
          <span>增强版测试</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="collapsed ? Expand : Fold"
            @click="toggleSidebar"
            circle
          />
          
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumb"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-button type="primary" @click="testConnection">
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataLine,
  Star,
  ChatDotRound,
  Setting,
  Expand,
  Fold,
  Connection,
  TrendCharts
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores'
import { systemApi } from '@/api'

const route = useRoute()
const appStore = useAppStore()

// 计算属性
const collapsed = computed(() => appStore.sidebarCollapsed)
const sidebarWidth = computed(() => collapsed.value ? '64px' : '200px')
const breadcrumb = computed(() => appStore.breadcrumb)

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 测试连接
const testConnection = async () => {
  try {
    await systemApi.health()
    ElMessage.success('后端连接正常')
  } catch (error) {
    ElMessage.error('后端连接失败')
  }
}

// 更新面包屑
const updateBreadcrumb = () => {
  const routePath = route.path
  const breadcrumbMap = {
    '/dashboard': [{ title: '仪表板', path: '/dashboard' }],
    '/core-intents': [
      { title: '意图管理', path: '' },
      { title: '核心意图', path: '/core-intents' }
    ],
    '/non-core-intents': [
      { title: '意图管理', path: '' },
      { title: '非核心意图', path: '/non-core-intents' }
    ],
    '/categories': [
      { title: '意图管理', path: '' },
      { title: '意图分类', path: '/categories' }
    ],
    '/response-templates': [{ title: '首句回复管理', path: '/response-templates' }],
    '/test': [{ title: '意图测试', path: '/test' }],
    '/data-insights': [{ title: '数据洞察', path: '/data-insights' }],
    '/enhanced-test': [{ title: '增强版测试', path: '/enhanced-test' }]
  }
  
  appStore.setBreadcrumb(breadcrumbMap[routePath] || [])
}

// 监听路由变化
onMounted(() => {
  updateBreadcrumb()
})

// 监听路由变化
watch(() => route.path, updateBreadcrumb)
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: white;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #262d3a;
  border-bottom: 1px solid #3d4757;
}

.logo h2 {
  color: white;
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.sidebar-menu {
  border: none;
  background-color: transparent;
}

.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title {
  color: #bfcbd9;
  border-bottom: none;
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-sub-menu__title:hover {
  background-color: #3d4757;
  color: white;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: white;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
}

.el-breadcrumb {
  font-size: 14px;
}
</style> 