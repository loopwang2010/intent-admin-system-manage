<template>
  <div class="intent-test">
    <div class="page-header">
      <h1>意图测试</h1>
    </div>
    
    <div class="test-form">
      <div class="form-group">
        <label>输入文本</label>
        <input 
          v-model="testForm.input" 
          placeholder="请输入要测试的文本"
          @keyup.enter="runTest"
          type="text"
        />
      </div>
      
      <div class="form-group">
        <label>语言</label>
        <select v-model="testForm.language">
          <option value="zh-CN">中文</option>
          <option value="en-US">英文</option>
        </select>
      </div>
      
      <div class="form-group">
        <button 
          class="btn-primary"
          @click="runTest"
          :disabled="loading || !testForm.input.trim()"
        >
          {{ loading ? '测试中...' : '开始测试' }}
        </button>
      </div>
    </div>

    <div v-show="testResult" class="test-result">
      <h3>测试结果</h3>
      
      <div class="result-grid">
        <div class="result-item">
          <label>匹配意图:</label>
          <span>{{ testResult?.matchedIntent || '未匹配' }}</span>
        </div>
        <div class="result-item">
          <label>置信度:</label>
          <span>{{ testResult?.confidence || 0 }}%</span>
        </div>
        <div class="result-item">
          <label>意图类型:</label>
          <span>{{ testResult?.intentType || '未知' }}</span>
        </div>
        <div class="result-item">
          <label>响应时间:</label>
          <span>{{ testResult?.responseTime || 0 }}ms</span>
        </div>
      </div>
    </div>

    <div v-show="testHistory.length > 0" class="test-history">
      <h3>测试历史</h3>
      
      <table class="history-table">
        <thead>
          <tr>
            <th>输入文本</th>
            <th>匹配结果</th>
            <th>置信度</th>
            <th>测试时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in testHistory" :key="index">
            <td>{{ record.input }}</td>
            <td>{{ record.result }}</td>
            <td>{{ record.confidence }}</td>
            <td>{{ record.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'IntentTest',
  setup() {
    const testForm = ref({
      input: '',
      language: 'zh-CN'
    })

    const loading = ref(false)
    const testResult = ref(null)
    const testHistory = ref([])

    const runTest = async () => {
      if (!testForm.value.input.trim()) {
        alert('请输入要测试的文本')
        return
      }

      loading.value = true
      
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 模拟测试结果
        const mockResult = {
          matchedIntent: getMockIntent(testForm.value.input),
          confidence: Math.floor(Math.random() * 30) + 70,
          intentType: 'core',
          responseTime: Math.floor(Math.random() * 200) + 50
        }
        
        testResult.value = mockResult
        
        // 添加到历史记录
        testHistory.value.unshift({
          input: testForm.value.input,
          result: mockResult.matchedIntent,
          confidence: mockResult.confidence + '%',
          time: new Date().toLocaleTimeString()
        })
        
        // 只保留最近10条记录
        if (testHistory.value.length > 10) {
          testHistory.value = testHistory.value.slice(0, 10)
        }
        
        console.log('测试完成')
      } catch (error) {
        console.error('测试失败:', error)
        alert('测试失败，请重试')
      } finally {
        loading.value = false
      }
    }

    const getMockIntent = (text) => {
      const keywords = {
        '播放': '音乐播放',
        '音乐': '音乐播放', 
        '天气': '天气查询',
        '时间': '时间查询',
        '几点': '时间查询',
        '新闻': '新闻播报',
        '笑话': '娱乐聊天',
        '故事': '故事播放',
        '定时': '定时提醒'
      }
      
      for (const [keyword, intent] of Object.entries(keywords)) {
        if (text.includes(keyword)) {
          return intent
        }
      }
      
      return '通用对话'
    }

    return {
      testForm,
      loading,
      testResult,
      testHistory,
      runTest
    }
  }
}
</script>

<style scoped>
.intent-test {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.test-form,
.test-result,
.test-history {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #606266;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #409eff;
}

.btn-primary {
  background: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover:not(:disabled) {
  background: #337ecc;
}

.btn-primary:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.test-result h3,
.test-history h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.result-item label {
  font-weight: 600;
  color: #606266;
}

.result-item span {
  color: #409eff;
  font-weight: 500;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.history-table th {
  background: #f5f7fa;
  font-weight: 600;
  font-size: 14px;
}

.history-table td {
  font-size: 14px;
}
</style>