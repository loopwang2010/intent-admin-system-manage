# 智能音箱意图分类体系设计

## 分类层级结构

### 一级分类（大分类）
1. **娱乐休闲** (Entertainment)
2. **生活服务** (Life Services)  
3. **信息查询** (Information Query)
4. **智能控制** (Smart Control)
5. **社交互动** (Social Interaction)
6. **学习教育** (Education)
7. **健康运动** (Health & Sports)
8. **商务办公** (Business & Office)

### 二级分类（小分类）

#### 1. 娱乐休闲 (Entertainment)
- 音乐播放 (Music Playback)
- 视频娱乐 (Video Entertainment)
- 游戏互动 (Gaming)
- 故事相声 (Stories & Comedy)
- 广播电台 (Radio)

#### 2. 生活服务 (Life Services)
- 天气查询 (Weather Query)
- 交通出行 (Transportation)
- 美食餐饮 (Food & Dining)
- 购物消费 (Shopping)
- 生活助手 (Life Assistant)

#### 3. 信息查询 (Information Query)
- 新闻资讯 (News)
- 百科知识 (Encyclopedia)
- 翻译服务 (Translation)
- 计算服务 (Calculation)
- 搜索查询 (Search)

#### 4. 智能控制 (Smart Control)
- 智能家居 (Smart Home)
- 设备控制 (Device Control)
- 系统设置 (System Settings)
- 音响控制 (Audio Control)

#### 5. 社交互动 (Social Interaction)
- 语音通话 (Voice Call)
- 消息提醒 (Message Reminder)
- 社交分享 (Social Sharing)
- 情感交流 (Emotional Communication)

#### 6. 学习教育 (Education)
- 儿童教育 (Children Education)
- 语言学习 (Language Learning)
- 技能培训 (Skill Training)
- 知识问答 (Q&A)

#### 7. 健康运动 (Health & Sports)
- 健康监测 (Health Monitoring)
- 运动健身 (Sports & Fitness)
- 医疗咨询 (Medical Consultation)
- 养生保健 (Health Care)

#### 8. 商务办公 (Business & Office)
- 日程管理 (Schedule Management)
- 会议助手 (Meeting Assistant)
- 文档处理 (Document Processing)
- 通讯录管理 (Contact Management)

## 数据库设计

### intent_categories 表扩展字段
- `parentId` - 父分类ID（NULL表示一级分类）
- `level` - 分类层级（1或2）
- `code` - 分类代码（用于API和路由）
- `color` - 分类颜色标识
- `isLeaf` - 是否叶子节点
- `childrenCount` - 子分类数量

### 分类编码规范
- 一级分类：ENT, LIFE, INFO, CTRL, SOCIAL, EDU, HEALTH, BIZ
- 二级分类：ENT_MUSIC, ENT_VIDEO, LIFE_WEATHER, 等

## 迁移策略

1. 备份现有数据
2. 扩展表结构
3. 创建新的分类体系
4. 迁移现有意图到新分类
5. 更新前后端代码
6. 测试验证