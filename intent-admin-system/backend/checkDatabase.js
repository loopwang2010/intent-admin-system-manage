const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'intent_admin.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 数据库分析报告 ===\n');

// 检查所有表
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('错误:', err);
        return;
    }
    
    console.log('📊 数据库表列表:');
    tables.forEach(table => console.log(`  - ${table.name}`));
    console.log('');
    
    // 检查核心意图数据
    db.all("SELECT COUNT(*) as count FROM core_intents", (err, result) => {
        if (err) {
            console.error('核心意图查询错误:', err);
        } else {
            console.log(`🎯 核心意图总数: ${result[0].count}`);
        }
        
        // 查看核心意图的表结构
        db.all("PRAGMA table_info(core_intents)", (err, columns) => {
            if (err) {
                console.error('表结构查询错误:', err);
            } else {
                console.log('\n📋 核心意图表结构:');
                columns.forEach(col => {
                    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
                });
            }
            
            // 查看核心意图样本数据（只显示关键信息）
            db.all("SELECT id, name, categoryId, confidence, priority FROM core_intents LIMIT 20", (err, samples) => {
                if (err) {
                    console.error('样本数据查询错误:', err);
                } else {
                    console.log('\n🔍 核心意图样本数据（前20条）:');
                    samples.forEach((sample, index) => {
                        console.log(`${index + 1}. [ID:${sample.id}] ${sample.name} (分类:${sample.categoryId}, 置信度:${sample.confidence}, 优先级:${sample.priority})`);
                    });
                }
                
                // 按分类统计（使用正确的字段名）
                db.all("SELECT categoryId, COUNT(*) as count FROM core_intents GROUP BY categoryId", (err, categoryStats) => {
                    if (err) {
                        console.error('分类统计错误:', err);
                    } else {
                        console.log('\n📈 核心意图分类统计:');
                        categoryStats.forEach(stat => {
                            console.log(`  分类ID ${stat.categoryId}: ${stat.count} 条`);
                        });
                    }
                    
                    // 检查非核心意图数据
                    db.all("SELECT COUNT(*) as count FROM non_core_intents", (err, result) => {
                        if (err) {
                            console.error('非核心意图查询错误:', err);
                        } else {
                            console.log(`\n🎪 非核心意图总数: ${result[0].count}`);
                        }
                        
                        // 查看CSV文件分析结果
                        const fs = require('fs');
                        try {
                            const analysisData = JSON.parse(fs.readFileSync('./data/intent_files_analysis.json', 'utf8'));
                            console.log('\n📁 CSV文件分析结果:');
                            Object.keys(analysisData).forEach(filename => {
                                const data = analysisData[filename];
                                console.log(`  ${filename}: ${data.totalRecords || 0} 条记录`);
                            });
                        } catch (error) {
                            console.log('\n⚠️  无法读取CSV分析文件');
                        }
                        
                        console.log('\n💡 核心发现:');
                        console.log('  - 数据库中只有44条核心意图（基础意图数据）');
                        console.log('  - 50,000条数据在CSV文件中，尚未全部导入到数据库');
                        console.log('  - 没有subtype（子类型）字段，这可能是无法查看的原因');
                        
                        // 关闭数据库连接
                        db.close((err) => {
                            if (err) {
                                console.error('关闭数据库错误:', err);
                            } else {
                                console.log('\n✅ 数据库分析完成');
                            }
                        });
                    });
                });
            });
        });
    });
}); 