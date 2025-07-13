import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'

// 静态导入组件
import Login from '@/views/Login.vue'
import Layout from '@/layout/index.vue'
import Dashboard from '@/views/Dashboard.vue'
import CoreIntents from '@/views/CoreIntents.vue'
import NonCoreIntents from '@/views/NonCoreIntents.vue'
import Categories from '@/views/Categories.vue'
import PreResponses from '@/views/PreResponses.vue'
import IntentTest from '@/views/IntentTest.vue'
import Analytics from '@/views/Analytics.vue'
import Users from '@/views/Users.vue'
import Profile from '@/views/Profile.vue'
import NotFound from '@/views/NotFound.vue'
import AuditLogs from '@/views/AuditLogs.vue'
import PermissionManagement from '@/views/PermissionManagement.vue'
import DataVisualization from '@/views/DataVisualization.vue'
import SecurityMonitor from '@/views/SecurityMonitor.vue'
import PerformanceMonitor from '@/views/PerformanceMonitor.vue'
import SystemDashboard from '@/views/SystemDashboard.vue'
import UserPermissions from '@/views/UserPermissions.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false,
      hideInMenu: true
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '仪表板',
          icon: 'Dashboard',
          requiresAuth: true
        }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: Categories,
        meta: {
          title: '意图分类',
          icon: 'Collection',
          requiresAuth: true,
          permissions: ['admin', 'editor', 'viewer']
        }
      },
      {
        path: 'core-intents',
        name: 'CoreIntents',
        component: CoreIntents,
        meta: {
          title: '核心意图',
          icon: 'ChatDotSquare',
          requiresAuth: true,
          permissions: ['admin', 'editor', 'viewer']
        }
      },
      {
        path: 'non-core-intents',
        name: 'NonCoreIntents',
        component: NonCoreIntents,
        meta: {
          title: '非核心意图',
          icon: 'ChatLineSquare',
          requiresAuth: true,
          permissions: ['admin', 'editor', 'viewer']
        }
      },
      {
        path: 'pre-responses',
        name: 'PreResponses',
        component: PreResponses,
        meta: {
          title: '回复模板',
          icon: 'ChatRound',
          requiresAuth: true,
          permissions: ['admin', 'editor', 'viewer']
        }
      },
      {
        path: 'intent-test',
        name: 'IntentTest',
        component: IntentTest,
        meta: {
          title: '意图测试',
          icon: 'Aim',
          requiresAuth: true,
          permissions: ['admin', 'editor', 'viewer']
        }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: Analytics,
        meta: {
          title: '数据分析',
          icon: 'TrendCharts',
          requiresAuth: true,
          permissions: ['admin', 'editor']
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: Users,
        meta: {
          title: '用户管理',
          icon: 'User',
          requiresAuth: true,
          permissions: ['admin']
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: {
          title: '个人资料',
          icon: 'Avatar',
          requiresAuth: true,
          hideInMenu: true
        }
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: AuditLogs,
        meta: {
          title: '审计日志',
          icon: 'Document',
          requiresAuth: true,
          permissions: ['admin', 'manager']
        }
      },
      {
        path: 'permission-management',
        name: 'PermissionManagement',
        component: PermissionManagement,
        meta: {
          title: '权限管理',
          icon: 'Lock',
          requiresAuth: true,
          permissions: ['admin']
        }
      },
      {
        path: 'data-visualization',
        name: 'DataVisualization',
        component: DataVisualization,
        meta: {
          title: '数据可视化',
          icon: 'DataAnalysis',
          requiresAuth: true,
          permissions: ['admin', 'manager']
        }
      },
      {
        path: 'security-monitor',
        name: 'SecurityMonitor',
        component: SecurityMonitor,
        meta: {
          title: '安全监控',
          icon: 'Shield',
          requiresAuth: true,
          permissions: ['admin']
        }
      },
      {
        path: 'performance-monitor',
        name: 'PerformanceMonitor',
        component: PerformanceMonitor,
        meta: {
          title: '性能监控',
          icon: 'Monitor',
          requiresAuth: true,
          permissions: ['admin']
        }
      },
      {
        path: 'system-dashboard',
        name: 'SystemDashboard',
        component: SystemDashboard,
        meta: {
          title: '系统仪表板',
          icon: 'Platform',
          requiresAuth: true,
          permissions: ['admin']
        }
      },
      {
        path: 'user-permissions',
        name: 'UserPermissions',
        component: UserPermissions,
        meta: {
          title: '用户权限配置',
          icon: 'Setting',
          requiresAuth: true,
          permissions: ['admin']
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面未找到',
      hideInMenu: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 智能音箱意图管理系统` : '智能音箱意图管理系统'
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查权限
    if (to.meta.permissions) {
      const hasPermission = authStore.hasPermission(to.meta.permissions)
      
      if (!hasPermission) {
        // 权限不足，跳转到首页
        next('/')
        return
      }
    }
    
    // 验证token有效性（生产环境）
    if (!import.meta.env.DEV && !await authStore.checkTokenValid()) {
      next('/login')
      return
    }
  } else {
    // 如果已登录且访问登录页，重定向到首页
    if (to.path === '/login' && authStore.isAuthenticated) {
      next('/')
      return
    }
  }
  
  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 页面加载完成后的处理
  console.log(`导航到: ${to.path}`)
})

export default router 