const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'intent_admin.db');
const db = new sqlite3.Database(dbPath);

class MassiveIntentImporter {
    constructor() {
        this.importStats = {
            coreIntents: 0,
            nonCoreIntents: 0,
            errors: 0,
            duplicates: 0
        };
        this.processedSubtypes = new Set();
        this.batch = [];
        this.batchSize = 100;
    }

    async importFromCSV(filename) {
        const filepath = path.join(__dirname, '..', '..', filename);
        
        if (!fs.existsSync(filepath)) {
            console.log(`❌ 文件不存在: ${filename}`);
            return;
        }

        console.log(`\n📊 开始导入: ${filename}`);
        console.log(`📦 文件大小: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);

        return new Promise((resolve) => {
            let rowCount = 0;
            
            fs.createReadStream(filepath)
                .pipe(csv())
                .on('data', async (row) => {
                    rowCount++;
                    
                    // 处理数据
                    await this.processRow(row, filename);
                    
                    // 每1000行输出进度
                    if (rowCount % 1000 === 0) {
                        console.log(`  📈 已处理: ${rowCount} 行`);
                    }
                })
                .on('end', async () => {
                    // 处理剩余的批次数据
                    if (this.batch.length > 0) {
                        await this.processBatch();
                    }
                    
                    console.log(`✅ ${filename} 导入完成，共处理 ${rowCount} 行`);
                    resolve();
                })
                .on('error', (error) => {
                    console.error(`❌ 导入 ${filename} 时出错:`, error);
                    this.importStats.errors++;
                    resolve();
                });
        });
    }

    async processRow(row, source) {
        try {
            const { intent_type, subtype, template } = row;
            
            if (!subtype || !template) {
                this.importStats.errors++;
                return;
            }

            // 添加到批次处理队列
            this.batch.push({
                intent_type,
                subtype,
                template,
                source
            });

            // 当批次达到指定大小时处理
            if (this.batch.length >= this.batchSize) {
                await this.processBatch();
            }

        } catch (error) {
            console.error('处理行数据时出错:', error);
            this.importStats.errors++;
        }
    }

    async processBatch() {
        if (this.batch.length === 0) return;

        try {
            // 按意图类型分组处理
            const coreIntents = this.batch.filter(item => item.intent_type === 'core');
            const nonCoreIntents = this.batch.filter(item => item.intent_type === 'non_core');

            // 处理核心意图
            if (coreIntents.length > 0) {
                await this.insertCoreIntents(coreIntents);
            }

            // 处理非核心意图
            if (nonCoreIntents.length > 0) {
                await this.insertNonCoreIntents(nonCoreIntents);
            }

            // 清空批次
            this.batch = [];

        } catch (error) {
            console.error('批次处理错误:', error);
            this.importStats.errors += this.batch.length;
            this.batch = [];
        }
    }

    async insertCoreIntents(intents) {
        // 按子类型分组
        const groupedBySubtype = {};
        intents.forEach(intent => {
            if (!groupedBySubtype[intent.subtype]) {
                groupedBySubtype[intent.subtype] = [];
            }
            groupedBySubtype[intent.subtype].push(intent.template);
        });

        // 为每个子类型创建或更新核心意图
        for (const [subtype, templates] of Object.entries(groupedBySubtype)) {
            try {
                // 检查是否已存在
                const existing = await this.findExistingCoreIntent(subtype);
                
                if (existing) {
                    // 更新现有记录，合并关键词
                    await this.updateCoreIntentKeywords(existing.id, templates);
                    this.importStats.duplicates++;
                } else {
                    // 创建新记录
                    await this.createNewCoreIntent(subtype, templates);
                    this.importStats.coreIntents++;
                }
                
                this.processedSubtypes.add(subtype);
                
            } catch (error) {
                console.error(`处理核心意图 ${subtype} 时出错:`, error);
                this.importStats.errors++;
            }
        }
    }

    async insertNonCoreIntents(intents) {
        // 按子类型分组
        const groupedBySubtype = {};
        intents.forEach(intent => {
            if (!groupedBySubtype[intent.subtype]) {
                groupedBySubtype[intent.subtype] = [];
            }
            groupedBySubtype[intent.subtype].push(intent.template);
        });

        // 为每个子类型创建或更新非核心意图
        for (const [subtype, templates] of Object.entries(groupedBySubtype)) {
            try {
                // 检查是否已存在
                const existing = await this.findExistingNonCoreIntent(subtype);
                
                if (existing) {
                    // 更新现有记录
                    await this.updateNonCoreIntentKeywords(existing.id, templates);
                    this.importStats.duplicates++;
                } else {
                    // 创建新记录
                    await this.createNewNonCoreIntent(subtype, templates);
                    this.importStats.nonCoreIntents++;
                }
                
            } catch (error) {
                console.error(`处理非核心意图 ${subtype} 时出错:`, error);
                this.importStats.errors++;
            }
        }
    }

    findExistingCoreIntent(subtype) {
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT * FROM core_intents WHERE name = ? OR keywords LIKE ?",
                [subtype, `%${subtype}%`],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    findExistingNonCoreIntent(subtype) {
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT * FROM non_core_intents WHERE name = ? OR keywords LIKE ?",
                [subtype, `%${subtype}%`],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    createNewCoreIntent(subtype, templates) {
        return new Promise((resolve, reject) => {
            // 从模板中提取关键词
            const keywords = this.extractKeywords(templates);
            const categoryId = this.mapSubtypeToCategory(subtype);
            
            const sql = `INSERT INTO core_intents 
                (name, description, categoryId, keywords, confidence, priority, status, usageCount, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;
            
            const values = [
                subtype,
                `${subtype}相关的意图识别 - 从CSV数据导入`,
                categoryId,
                JSON.stringify(keywords),
                0.8,
                1,
                'active',
                0
            ];

            db.run(sql, values, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    createNewNonCoreIntent(subtype, templates) {
        return new Promise((resolve, reject) => {
            // 从模板中提取关键词
            const keywords = this.extractKeywords(templates);
            const responses = this.generateResponses(subtype, templates);
            
            const sql = `INSERT INTO non_core_intents 
                (name, description, keywords, responses, priority, status, usageCount, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;
            
            const values = [
                subtype,
                `${subtype}相关的非核心意图 - 从CSV数据导入`,
                JSON.stringify(keywords),
                JSON.stringify(responses),
                1,
                'active',
                0
            ];

            db.run(sql, values, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    updateCoreIntentKeywords(id, templates) {
        return new Promise((resolve, reject) => {
            // 获取现有关键词
            db.get("SELECT keywords FROM core_intents WHERE id = ?", [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const existingKeywords = JSON.parse(row.keywords || '[]');
                    const newKeywords = this.extractKeywords(templates);
                    const mergedKeywords = [...new Set([...existingKeywords, ...newKeywords])];

                    db.run(
                        "UPDATE core_intents SET keywords = ?, updatedAt = datetime('now') WHERE id = ?",
                        [JSON.stringify(mergedKeywords), id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    updateNonCoreIntentKeywords(id, templates) {
        return new Promise((resolve, reject) => {
            // 获取现有关键词
            db.get("SELECT keywords FROM non_core_intents WHERE id = ?", [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const existingKeywords = JSON.parse(row.keywords || '[]');
                    const newKeywords = this.extractKeywords(templates);
                    const mergedKeywords = [...new Set([...existingKeywords, ...newKeywords])];

                    db.run(
                        "UPDATE non_core_intents SET keywords = ?, updatedAt = datetime('now') WHERE id = ?",
                        [JSON.stringify(mergedKeywords), id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    extractKeywords(templates) {
        const keywords = new Set();
        
        templates.slice(0, 20).forEach(template => { // 限制处理数量避免过大
            if (template && template.length <= 50) { // 只处理较短的模板作为关键词
                keywords.add(template.trim());
            }
        });
        
        return Array.from(keywords);
    }

    mapSubtypeToCategory(subtype) {
        // 简单的分类映射
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

    generateResponses(subtype, templates) {
        // 为非核心意图生成默认回复
        const responses = [
            `好的，关于${subtype}的问题我已经收到了。`,
            `我理解您想了解${subtype}相关的内容。`,
            `关于${subtype}，让我来帮您处理。`
        ];
        
        return responses;
    }

    async printStats() {
        console.log('\n=== 导入统计报告 ===');
        console.log(`✅ 新增核心意图: ${this.importStats.coreIntents}`);
        console.log(`✅ 新增非核心意图: ${this.importStats.nonCoreIntents}`);
        console.log(`⚠️  重复项: ${this.importStats.duplicates}`);
        console.log(`❌ 错误: ${this.importStats.errors}`);
        console.log(`🏷️  处理的子类型: ${this.processedSubtypes.size}`);
        
        console.log('\n🏷️  导入的子类型列表:');
        Array.from(this.processedSubtypes).forEach((subtype, index) => {
            console.log(`  ${index + 1}. ${subtype}`);
        });
        
        // 检查数据库最终状态
        const coreCount = await this.getTableCount('core_intents');
        const nonCoreCount = await this.getTableCount('non_core_intents');
        
        console.log('\n📊 数据库最终状态:');
        console.log(`  核心意图总数: ${coreCount}`);
        console.log(`  非核心意图总数: ${nonCoreCount}`);
        console.log(`  总计: ${coreCount + nonCoreCount}`);
    }

    getTableCount(tableName) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }
}

async function main() {
    console.log('=== 开始导入海量意图数据 ===\n');
    
    const importer = new MassiveIntentImporter();
    
    const files = [
        'all_intents_ultra_expanded.csv'  // 先导入最大的文件
    ];
    
    try {
        for (const file of files) {
            await importer.importFromCSV(file);
        }
        
        await importer.printStats();
        
        console.log('\n🎉 导入完成！现在您可以在系统中查看所有的意图数据了。');
        console.log('💡 建议：重启前端应用以查看最新数据。');
        
    } catch (error) {
        console.error('导入过程中出现错误:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('关闭数据库连接时出错:', err);
            } else {
                console.log('✅ 数据库连接已关闭');
            }
        });
    }
}

main().catch(console.error); 