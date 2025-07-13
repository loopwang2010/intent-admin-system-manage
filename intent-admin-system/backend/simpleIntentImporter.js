const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'intent_admin.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 开始导入50,000条意图数据 ===\n');

// 首先修改数据库表结构，添加subtype字段
console.log('📋 检查并更新表结构...');

db.serialize(() => {
    // 为核心意图表添加subtype字段
    db.run("ALTER TABLE core_intents ADD COLUMN subtype TEXT", (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('添加subtype字段到core_intents时出错:', err.message);
        } else {
            console.log('✅ core_intents表的subtype字段已准备就绪');
        }
    });

    // 为非核心意图表添加subtype字段
    db.run("ALTER TABLE non_core_intents ADD COLUMN subtype TEXT", (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('添加subtype字段到non_core_intents时出错:', err.message);
        } else {
            console.log('✅ non_core_intents表的subtype字段已准备就绪');
        }
    });

    console.log('\n📊 开始读取CSV文件...');
    
    // 读取CSV文件
    const csvFile = path.join(__dirname, '..', '..', 'all_intents_ultra_expanded.csv');
    const csvContent = fs.readFileSync(csvFile, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📈 CSV文件包含 ${lines.length} 行数据`);
    
    // 解析CSV数据
    const headers = lines[0].split(',');
    console.log(`📋 CSV字段: ${headers.join(', ')}`);
    
    // 按子类型分组数据
    const subtypeGroups = {};
    let processedRows = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length >= 3) {
            const intent_type = values[0].trim();
            const subtype = values[1].trim();
            const template = values[2].trim();
            
            if (subtype && template) {
                if (!subtypeGroups[subtype]) {
                    subtypeGroups[subtype] = {
                        intent_type: intent_type,
                        templates: []
                    };
                }
                subtypeGroups[subtype].templates.push(template);
                processedRows++;
            }
        }
        
        if (processedRows % 10000 === 0) {
            console.log(`  📈 已处理: ${processedRows} 行`);
        }
    }
    
    console.log(`\n✅ 数据预处理完成`);
    console.log(`📊 发现 ${Object.keys(subtypeGroups).length} 个不同的子类型`);
    console.log(`📈 总共处理了 ${processedRows} 条记录\n`);
    
    // 开始插入数据
    console.log('🚀 开始将数据插入数据库...');
    
    const subtypes = Object.keys(subtypeGroups);
    let insertedCore = 0;
    let insertedNonCore = 0;
    let updated = 0;
    
    function processNextSubtype(index) {
        if (index >= subtypes.length) {
            // 完成所有插入
            console.log('\n=== 导入完成 ===');
            console.log(`✅ 新增核心意图: ${insertedCore}`);
            console.log(`✅ 新增非核心意图: ${insertedNonCore}`);
            console.log(`⚠️  更新现有意图: ${updated}`);
            
            // 检查最终结果
            db.get("SELECT COUNT(*) as count FROM core_intents", (err, row) => {
                if (!err) {
                    console.log(`📊 核心意图总数: ${row.count}`);
                }
            });
            
            db.get("SELECT COUNT(*) as count FROM non_core_intents", (err, row) => {
                if (!err) {
                    console.log(`📊 非核心意图总数: ${row.count}`);
                }
                
                console.log('\n🎉 50,000条意图数据导入完成！');
                console.log('💡 现在您可以在系统中查看按子类型组织的意图数据了。');
                
                db.close();
            });
            
            return;
        }
        
        const subtype = subtypes[index];
        const group = subtypeGroups[subtype];
        
        // 从模板中提取关键词（前20个）
        const keywords = group.templates.slice(0, 20);
        
        if (group.intent_type === 'core') {
            // 检查是否已存在该子类型的核心意图
            db.get("SELECT id FROM core_intents WHERE name = ? OR subtype = ?", [subtype, subtype], (err, existing) => {
                if (err) {
                    console.error(`查询核心意图 ${subtype} 时出错:`, err);
                    processNextSubtype(index + 1);
                    return;
                }
                
                if (existing) {
                    // 更新现有记录
                    const newKeywords = JSON.stringify(keywords);
                    db.run(
                        "UPDATE core_intents SET keywords = ?, subtype = ?, updatedAt = datetime('now') WHERE id = ?",
                        [newKeywords, subtype, existing.id],
                        (err) => {
                            if (err) {
                                console.error(`更新核心意图 ${subtype} 时出错:`, err);
                            } else {
                                updated++;
                            }
                            processNextSubtype(index + 1);
                        }
                    );
                } else {
                    // 创建新记录
                    const categoryId = mapSubtypeToCategory(subtype);
                    db.run(
                        `INSERT INTO core_intents (name, description, categoryId, keywords, confidence, priority, status, usageCount, subtype, createdAt, updatedAt)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                        [
                            subtype,
                            `${subtype}相关的意图识别 - 从CSV数据导入`,
                            categoryId,
                            JSON.stringify(keywords),
                            0.8,
                            1,
                            'active',
                            0,
                            subtype
                        ],
                        (err) => {
                            if (err) {
                                console.error(`插入核心意图 ${subtype} 时出错:`, err);
                            } else {
                                insertedCore++;
                            }
                            processNextSubtype(index + 1);
                        }
                    );
                }
            });
        } else {
            // 处理非核心意图
            db.get("SELECT id FROM non_core_intents WHERE name = ? OR subtype = ?", [subtype, subtype], (err, existing) => {
                if (err) {
                    console.error(`查询非核心意图 ${subtype} 时出错:`, err);
                    processNextSubtype(index + 1);
                    return;
                }
                
                const responses = [
                    `好的，关于${subtype}的问题我已经收到了。`,
                    `我理解您想了解${subtype}相关的内容。`,
                    `关于${subtype}，让我来帮您处理。`
                ];
                
                if (existing) {
                    // 更新现有记录
                    db.run(
                        "UPDATE non_core_intents SET keywords = ?, responses = ?, subtype = ?, updatedAt = datetime('now') WHERE id = ?",
                        [JSON.stringify(keywords), JSON.stringify(responses), subtype, existing.id],
                        (err) => {
                            if (err) {
                                console.error(`更新非核心意图 ${subtype} 时出错:`, err);
                            } else {
                                updated++;
                            }
                            processNextSubtype(index + 1);
                        }
                    );
                } else {
                    // 创建新记录
                    db.run(
                        `INSERT INTO non_core_intents (name, description, keywords, responses, priority, status, usageCount, subtype, createdAt, updatedAt)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                        [
                            subtype,
                            `${subtype}相关的非核心意图 - 从CSV数据导入`,
                            JSON.stringify(keywords),
                            JSON.stringify(responses),
                            1,
                            'active',
                            0,
                            subtype
                        ],
                        (err) => {
                            if (err) {
                                console.error(`插入非核心意图 ${subtype} 时出错:`, err);
                            } else {
                                insertedNonCore++;
                            }
                            processNextSubtype(index + 1);
                        }
                    );
                }
            });
        }
        
        // 显示进度
        if ((index + 1) % 10 === 0) {
            console.log(`  📈 已处理子类型: ${index + 1}/${subtypes.length}`);
        }
    }
    
    // 开始处理第一个子类型
    processNextSubtype(0);
});

function mapSubtypeToCategory(subtype) {
    const categoryMap = {
        '时间查询': 5, '日期查询': 5,
        '天气查询': 2, '播放功能': 1,
        '设置提醒': 15, '搜索功能': 9,
        '计算功能': 6, '翻译功能': 7,
        '如何询问': 15, '为什么询问': 15,
        '控制设备': 4, '信息查询': 9,
        '导航路线': 13, '购物服务': 9,
        '通话服务': 9
    };
    
    return categoryMap[subtype] || 15; // 默认归到其他类别
} 