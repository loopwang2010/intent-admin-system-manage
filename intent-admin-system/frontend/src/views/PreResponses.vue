<template>
  <div class="pre-responses-page">
    <div class="page-header">
      <h1>回复模板管理</h1>
      <button class="btn-primary" @click="handleAdd">新增模板</button>
    </div>
    
    <div class="table-card">
      <div class="loading" v-if="loading">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>模板名称</th>
            <th>类型</th>
            <th>内容</th>
            <th>使用次数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="template in templates" :key="template.id">
            <td>{{ template.name }}</td>
            <td>{{ template.type }}</td>
            <td class="content-cell">{{ template.content }}</td>
            <td>{{ template.usage_count }}</td>
            <td>
              <span :class="['tag', template.status === 'active' ? 'tag-success' : 'tag-danger']">
                {{ template.status === 'active' ? '启用' : '禁用' }}
              </span>
            </td>
            <td>
              <button class="btn-text" @click="handleEdit(template)">编辑</button>
              <button class="btn-text btn-danger" @click="handleDelete(template)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'PreResponses',
  setup() {
    const templates = ref([
      {
        id: 1,
        name: '问候模板',
        type: 'text',
        content: '您好，有什么可以帮助您的吗？',
        usage_count: 156,
        status: 'active'
      },
      {
        id: 2,
        name: '音乐播放回复',
        type: 'text',
        content: '正在为您播放音乐...',
        usage_count: 89,
        status: 'active'
      },
      {
        id: 3,
        name: '天气查询回复',
        type: 'text',
        content: '今天的天气情况是...',
        usage_count: 234,
        status: 'active'
      }
    ])

    const loading = ref(false)

    const handleAdd = () => {
      console.log('添加模板功能')
    }

    const handleEdit = (template) => {
      console.log('编辑模板:', template.name)
    }

    const handleDelete = (template) => {
      console.log('删除模板:', template.name)
    }

    onMounted(() => {
      console.log('回复模板页面加载完成')
    })

    return {
      templates,
      loading,
      handleAdd,
      handleEdit,
      handleDelete
    }
  }
}
</script>

<style scoped>
.pre-responses-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.btn-primary {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #337ecc;
}

.btn-text {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  padding: 4px 8px;
  margin-right: 8px;
}

.btn-text:hover {
  color: #337ecc;
}

.btn-danger {
  color: #f56c6c;
}

.btn-danger:hover {
  color: #dd6161;
}

.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.content-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #f0f9ff;
  color: #1f2937;
}

.tag-success {
  background: #f0f9ff;
  color: #059669;
}

.tag-danger {
  background: #fef2f2;
  color: #dc2626;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>