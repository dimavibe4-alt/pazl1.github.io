// js/handbookStore.js
/* handbookStore.js - Data Layer для работы со справочниками */

// Забираем все справочники из localStorage
function getAllHandbooks() {
    try {
        return JSON.parse(localStorage.getItem('pazl-handbooks') || '{}');
    } catch (e) {
        console.error('Ошибка чтения справочников:', e);
        return {};
    }
}

// Сохраняем все справочники в localStorage
function saveAllHandbooks(map) {
    localStorage.setItem('pazl-handbooks', JSON.stringify(map));
}

/**
 * Единственный способ записать данные справочника на диск.
 */
async function saveToJsonFiles(name, data) {
    if (window.hbFs && typeof window.hbFs.upsertFull === 'function') {
        const fields = Array.isArray(data?.fields) ? data.fields : [];
        const rows   = Array.isArray(data?.data)   ? data.data   : [];
        try {
            const ok = await window.hbFs.upsertFull(name, fields, rows);
            if (ok) {
                console.log(`✅ "${name}" записан в JSON (schema + data)`);
            } else {
                console.log(`ℹ️ "${name}" сохранён только в localStorage (папка не выбрана)`);
            }
            return ok;
        } catch (err) {
            console.error(`❌ Ошибка записи "${name}" в JSON:`, err);
        }
    }
    return false;
}

/**
 * Базовое сохранение: обновляет localStorage, но не трогает JSON.
 */
function originalSaveHandbook(name, data) {
    const all = getAllHandbooks();
    const now = new Date().toISOString();
    const copy = JSON.parse(JSON.stringify(data || {}));
    copy.updatedAt = now;
    if (!copy.createdAt) copy.createdAt = now;

    all[name] = copy;
    saveAllHandbooks(all);
    console.log(`✅ "${name}" сохранён в localStorage`);
}

/**
 * Базовое удаление: удаляет только из localStorage.
 */
function originalDeleteHandbook(name) {
    const all = getAllHandbooks();
    delete all[name];
    saveAllHandbooks(all);
    console.log(`🗑️ "${name}" удалён из localStorage`);
}

/**
 * Очищает pending changes для конкретного справочника
 */
function clearPendingChangesForHandbook(name) {
    if (window.PendingChanges && window.PendingChanges.pendingChanges) {
        // Удаляем только если это не удаление (удаления обрабатываются в saveChanges)
        const change = window.PendingChanges.pendingChanges.handbooks[name];
        if (change && !change._deleted) {
            delete window.PendingChanges.pendingChanges.handbooks[name];
            console.log(`🧹 Очищены pending changes для "${name}"`);
            
            // Обновляем UI
            if (window.PendingChanges.updateUI) {
                window.PendingChanges.updateUI();
            }
        }
    }
}

/**
 * Сохраняет справочник и отмечает его «грязным».
 */
function saveHandbook(name, data) {
    originalSaveHandbook(name, data);
    if (window.PendingChanges && window.PendingChanges.pendingChanges) {
        window.PendingChanges.pendingChanges.handbooks[name] = JSON.parse(JSON.stringify(data || {}));
        window.PendingChanges.markChangesUnsaved();
    }
    console.log(`📝 "${name}" помечен как изменённый`);
}

/**
 * Помечает справочник к удалению.
 */
function deleteHandbook(name) {
    originalDeleteHandbook(name);
    if (window.PendingChanges && window.PendingChanges.pendingChanges) {
        window.PendingChanges.pendingChanges.handbooks[name] = { _deleted: true };
        window.PendingChanges.markChangesUnsaved();
    }
    console.log(`🗑️ "${name}" помечен для удаления`);
}

/**
 * Возвращает справочник.
 */
function loadHandbook(name) {
    const pc = window.PendingChanges?.pendingChanges?.handbooks || {};
    if (Object.prototype.hasOwnProperty.call(pc, name)) {
        const item = pc[name];
        if (item && item._deleted) return null;
        return item;
    }
    const all = getAllHandbooks();
    return all[name] || null;
}

/**
 * Немедленно сохраняет справочник в localStorage и очищает pending changes.
 */
function saveHandbookImmediately(name, data) {
    originalSaveHandbook(name, data);
    clearPendingChangesForHandbook(name);
}

/**
 * Получение списка всех имен справочников
 */
function getAllHandbookNames() {
    const all = getAllHandbooks();
    return Object.keys(all).sort();
}

/**
 * Проверка существования справочника
 */
function handbookExists(name) {
    const handbook = loadHandbook(name);
    return handbook !== null && handbook !== undefined;
}

/**
 * Получение количества справочников
 */
function getHandbooksCount() {
    const all = getAllHandbooks();
    return Object.keys(all).length;
}

/**
 * Улучшенный импорт справочника с поддержкой разных форматов
 */
function importHandbook(name, jsonData) {
    try {
        console.log('🔄 Импорт справочника:', name, jsonData);
        
        let handbookData = {};
        
        // Формат 1: Наш стандартный формат (metadata + data)
        if (jsonData.metadata && jsonData.data) {
            handbookData = {
                name: name,
                fields: jsonData.metadata.fields || [],
                data: jsonData.data || [],
                createdAt: jsonData.metadata.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        // Формат 2: Прямые поля в корне
        else if (jsonData.fields && Array.isArray(jsonData.fields)) {
            handbookData = {
                name: name,
                fields: jsonData.fields,
                data: jsonData.data || jsonData.rows || [],
                createdAt: jsonData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        // Формат 3: Простой массив данных без структуры
        else if (Array.isArray(jsonData)) {
            // Создаем базовую структуру полей на основе первого элемента
            const sampleItem = jsonData[0] || {};
            const fields = Object.keys(sampleItem).map(key => ({
                name: key,
                type: typeof sampleItem[key] === 'number' ? 'number' : 
                      typeof sampleItem[key] === 'boolean' ? 'boolean' : 'string'
            }));
            
            handbookData = {
                name: name,
                fields: fields,
                data: jsonData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        // Формат 4: Объект с вложенными справочниками
        else if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
            // Если это коллекция справочников, обработаем отдельно
            return importHandbookCollection(jsonData);
        }
        else {
            throw new Error('Неподдерживаемый формат файла');
        }
        
        saveHandbook(name, handbookData);
        console.log(`✅ Справочник "${name}" импортирован (${handbookData.fields.length} полей, ${handbookData.data.length} записей)`);
        return true;
        
    } catch (error) {
        console.error(`❌ Ошибка импорта справочника "${name}":`, error);
        return false;
    }
}

/**
 * Импорт коллекции справочников из одного файла
 */
function importHandbookCollection(collectionData) {
    try {
        let importedCount = 0;
        
        // Формат: { "handbook1": { fields: [], data: [] }, "handbook2": { ... } }
        if (collectionData.handbooks) {
            for (const [name, data] of Object.entries(collectionData.handbooks)) {
                if (importHandbook(name, data)) {
                    importedCount++;
                }
            }
        }
        // Формат: { "справочник1": { metadata: {}, data: [] }, ... }
        else {
            for (const [name, data] of Object.entries(collectionData)) {
                if (name !== 'version' && name !== 'exportedAt' && typeof data === 'object') {
                    if (importHandbook(name, data)) {
                        importedCount++;
                    }
                }
            }
        }
        
        console.log(`✅ Импортировано ${importedCount} справочников из коллекции`);
        return importedCount > 0;
        
    } catch (error) {
        console.error('❌ Ошибка импорта коллекции справочников:', error);
        return false;
    }
}

/**
 * Экспорт справочника в JSON
 */
function exportHandbook(name) {
    const handbook = loadHandbook(name);
    if (!handbook) {
        throw new Error('Справочник не найден');
    }
    
    const exportData = {
        metadata: {
            name: handbook.name,
            fields: handbook.fields,
            createdAt: handbook.createdAt,
            updatedAt: handbook.updatedAt
        },
        data: handbook.data
    };
    
    return exportData;
}

/**
 * Экспорт нескольких справочников
 */
function exportMultipleHandbooks(names) {
    const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalHandbooks: names.length,
        handbooks: {}
    };
    
    names.forEach(name => {
        const handbook = loadHandbook(name);
        if (handbook) {
            exportData.handbooks[name] = {
                metadata: {
                    name: handbook.name,
                    fields: handbook.fields,
                    createdAt: handbook.createdAt,
                    updatedAt: handbook.updatedAt
                },
                data: handbook.data
            };
        }
    });
    
    return exportData;
}

/**
 * Экспорт всех справочников
 */
function exportAllHandbooks() {
    const names = getAllHandbookNames();
    return exportMultipleHandbooks(names);
}

window.HandbookStore = {
    getAllHandbooks,
    saveAllHandbooks,
    originalSaveHandbook,
    originalDeleteHandbook,
    saveHandbook,
    deleteHandbook,
    loadHandbook,
    saveHandbookImmediately,
    saveToJsonFiles,
    getAllHandbookNames,
    handbookExists,
    getHandbooksCount,
    importHandbook,
    importHandbookCollection,
    exportHandbook,
    exportMultipleHandbooks,
    exportAllHandbooks,
    clearPendingChangesForHandbook  // Добавляем новую функцию в экспорт
};

console.log('✅ HandbookStore загружен');