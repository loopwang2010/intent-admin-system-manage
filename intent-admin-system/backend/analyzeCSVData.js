const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function analyzeCSVFile(filename) {
    const filepath = path.join(__dirname, '..', '..', filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`❌ 文件不存在: ${filename}`);
        return null;
    }
    
    console.log(`\n📊 分析文件: ${filename}`);
    console.log(`📦 文件大小: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
    
    return new Promise((resolve) => {
        let totalRows = 0;
        let headers = [];
        let sampleRows = [];
        let coreIntentTypes = new Set();
        let nonCoreIntentTypes = new Set();
        let subtypes = new Set();
        
        fs.createReadStream(filepath)
            .pipe(csv())
            .on('headers', (headerList) => {
                headers = headerList;
                console.log(`📋 字段: ${headers.join(', ')}`);
            })
            .on('data', (row) => {
                totalRows++;
                
                // 收集前5行作为样本
                if (sampleRows.length < 5) {
                    sampleRows.push(row);
                }
                
                // 分析意图类型
                if (row.intent_type) {
                    if (row.core_intent === 'true' || row.core_intent === true) {
                        coreIntentTypes.add(row.intent_type);
                    } else {
                        nonCoreIntentTypes.add(row.intent_type);
                    }
                }
                
                // 收集子类型
                if (row.subtype) {
                    subtypes.add(row.subtype);
                }
            })
            .on('end', () => {
                console.log(`📈 总行数: ${totalRows}`);
                console.log(`🎯 核心意图类型: ${coreIntentTypes.size} 种`);
                console.log(`🎪 非核心意图类型: ${nonCoreIntentTypes.size} 种`);
                console.log(`🏷️  子类型: ${subtypes.size} 种`);
                
                if (coreIntentTypes.size > 0) {
                    console.log('\n🎯 核心意图类型列表:');
                    Array.from(coreIntentTypes).slice(0, 10).forEach((type, index) => {
                        console.log(`  ${index + 1}. ${type}`);
                    });
                    if (coreIntentTypes.size > 10) {
                        console.log(`  ... 还有 ${coreIntentTypes.size - 10} 种`);
                    }
                }
                
                if (nonCoreIntentTypes.size > 0) {
                    console.log('\n🎪 非核心意图类型列表:');
                    Array.from(nonCoreIntentTypes).slice(0, 10).forEach((type, index) => {
                        console.log(`  ${index + 1}. ${type}`);
                    });
                    if (nonCoreIntentTypes.size > 10) {
                        console.log(`  ... 还有 ${nonCoreIntentTypes.size - 10} 种`);
                    }
                }
                
                if (subtypes.size > 0) {
                    console.log('\n🏷️  子类型样本:');
                    Array.from(subtypes).slice(0, 10).forEach((subtype, index) => {
                        console.log(`  ${index + 1}. ${subtype}`);
                    });
                    if (subtypes.size > 10) {
                        console.log(`  ... 还有 ${subtypes.size - 10} 种`);
                    }
                }
                
                console.log('\n📝 样本数据:');
                sampleRows.forEach((row, index) => {
                    console.log(`\n样本 ${index + 1}:`);
                    Object.keys(row).forEach(key => {
                        const value = row[key];
                        if (value && value.length > 100) {
                            console.log(`  ${key}: ${value.substring(0, 100)}...`);
                        } else {
                            console.log(`  ${key}: ${value}`);
                        }
                    });
                });
                
                resolve({
                    filename,
                    totalRows,
                    headers,
                    coreIntentTypes: Array.from(coreIntentTypes),
                    nonCoreIntentTypes: Array.from(nonCoreIntentTypes),
                    subtypes: Array.from(subtypes)
                });
            })
            .on('error', (error) => {
                console.error('❌ 读取错误:', error);
                resolve(null);
            });
    });
}

async function main() {
    console.log('=== CSV数据文件分析 ===');
    
    const files = [
        'all_intents_ultra_expanded.csv',
        'all_intents_priority_expanded.csv', 
        'all_intents_integrated.csv'
    ];
    
    const results = [];
    
    for (const file of files) {
        const result = await analyzeCSVFile(file);
        if (result) {
            results.push(result);
        }
    }
    
    console.log('\n=== 总结报告 ===');
    let totalRecords = 0;
    results.forEach(result => {
        console.log(`📁 ${result.filename}: ${result.totalRows} 条记录`);
        totalRecords += result.totalRows;
    });
    console.log(`📊 总计: ${totalRecords} 条记录`);
    
    console.log('\n💡 关键发现:');
    console.log('  - 这些CSV文件包含了大量的训练数据');
    console.log('  - 数据包含详细的意图分类和子类型信息');
    console.log('  - 目前这些数据还没有完全导入到数据库系统中');
    console.log('  - 需要创建数据导入脚本来将这些数据入库');
}

main().catch(console.error); 