// universal-warehouse-parser.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
class UniversalWarehouseParser {
    constructor() {
        this.supportedFormats = [
            'warehouse_catalog',
            'tires_catalog',  
            'metadata_format',
            'direct_array',
            'data_array', 
            'warehouses_array',
            'russian_fields',
            'tires_array'
        ];

        this.warehouseIndicators = ['sklad', 'warehouse', 'kategoriya', 'category', 'nazvanie', 'name'];
        this.tireIndicators = ['shina', 'tire', 'brend', 'brand', 'razmer', 'size', 'tiporazmer', 'model'];
    }

    /**
     * УНИВЕРСАЛЬНЫЙ ПАРСИНГ ДАННЫХ СКЛАДОВ
     */
    parseWarehouseData(data, source = 'unknown') {
        console.log(`🔄 Универсальный парсинг данных из: ${source}`);
        
        if (!data) {
            console.warn('⚠️ Получены пустые данные');
            return this.generateFallbackWarehouses();
        }

        try {
            const analysis = this.analyzeDataStructure(data);
            console.log('📊 Анализ структуры данных:', analysis);
            
            let resultWarehouses = [];
            
            switch (analysis.structureType) {
                case 'warehouse_catalog':
                    resultWarehouses = this.parseWarehouseCatalog(data);
                    break;
                    
                case 'tires_catalog':
                    resultWarehouses = this.parseTiresCatalog(data);
                    break;
                    
                case 'metadata_with_data':
                    resultWarehouses = this.parseMetadataFormat(data);
                    break;
                    
                case 'warehouses_array':
                    resultWarehouses = this.parseWarehousesArray(data);
                    break;
                    
                case 'tires_array':
                    resultWarehouses = this.parseTiresArray(data);
                    break;
                    
                case 'nested_warehouses':
                    resultWarehouses = this.parseNestedStructure(data);
                    break;
                    
                case 'key_value_pairs':
                    resultWarehouses = this.parseKeyValueStructure(data);
                    break;
                    
                case 'mixed_structure':
                    resultWarehouses = this.parseMixedStructure(data);
                    break;
                    
                default:
                    console.warn('⚠️ Неопределенная структура, пробуем универсальный метод');
                    resultWarehouses = this.parseUniversal(data);
            }
            
            const filteredWarehouses = this.filterAndValidateWarehouses(resultWarehouses);
            console.log(`✅ Универсальный парсинг завершен: ${filteredWarehouses.length} складов`);
            return filteredWarehouses;
            
        } catch (error) {
            console.error('❌ Критическая ошибка парсинга:', error);
            return this.generateFallbackWarehouses();
        }
    }

    /**
     * АНАЛИЗ СТРУКТУРЫ ДАННЫХ
     */
    analyzeDataStructure(data) {
        const analysis = {
            structureType: 'unknown',
            dataType: typeof data,
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : Object.keys(data).length,
            hasMetadata: false,
            hasWarehouses: false,
            hasTires: false,
            sampleKeys: [],
            tireIndicatorCount: 0,
            warehouseIndicatorCount: 0
        };

        if (typeof data === 'object' && data !== null) {
            const allKeys = this.getAllKeys(data);
            analysis.sampleKeys = allKeys.slice(0, 10);
            
            analysis.tireIndicatorCount = this.countIndicators(allKeys, this.tireIndicators);
            analysis.warehouseIndicatorCount = this.countIndicators(allKeys, this.warehouseIndicators);
            
            if (this.isWarehouseCatalog(data)) {
                analysis.structureType = 'warehouse_catalog';
                analysis.hasWarehouses = true;
            }
            else if (this.isTiresCatalog(data)) {
                analysis.structureType = 'tires_catalog';
                analysis.hasTires = true;
            }
            else if (data.metadata && data.data) {
                analysis.structureType = 'metadata_with_data';
                analysis.hasMetadata = true;
            } 
            else if (data.warehouses && Array.isArray(data.warehouses)) {
                analysis.structureType = 'warehouses_array';
                analysis.hasWarehouses = true;
            }
            else if (Array.isArray(data) && data.length > 0) {
                const firstItem = data[0];
                
                if (this.isTireData(firstItem)) {
                    analysis.structureType = 'tires_array';
                    analysis.hasTires = true;
                } 
                else if (this.isWarehouseData(firstItem)) {
                    analysis.structureType = 'warehouses_array';
                    analysis.hasWarehouses = true;
                }
                else {
                    analysis.structureType = 'unknown_array';
                }
            }
            else if (typeof data === 'object' && !Array.isArray(data)) {
                const nestedArrays = this.findNestedArrays(data);
                if (nestedArrays.length > 0) {
                    analysis.structureType = 'nested_warehouses';
                } else {
                    analysis.structureType = 'unknown_object';
                }
            }
        }

        return analysis;
    }

    /**
     * ПРОВЕРКА - ЭТО КАТАЛОГ СКЛАДОВ
     */
    isWarehouseCatalog(data) {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return false;
        
        const firstItem = data[0];
        return firstItem && 
               typeof firstItem === 'object' && 
               this.hasRussianField(firstItem, 'Склад') &&
               this.hasRussianField(firstItem, 'Категория склада');
    }

    /**
     * ПРОВЕРКА - ЭТО КАТАЛОГ ШИН
     */
    isTiresCatalog(data) {
        if (!data || typeof data !== 'object') return false;
        
        return data.metadata && 
               data.metadata.name === 'Шины' && 
               Array.isArray(data.data);
    }

    /**
     * ПРОВЕРКА РУССКИХ ПОЛЕЙ
     */
    hasRussianField(obj, fieldName) {
        for (let key in obj) {
            if (key === fieldName) return true;
        }
        return false;
    }

    /**
     * ПОЛУЧЕНИЕ РУССКОГО ПОЛЯ
     */
    getRussianField(obj, fieldName) {
        for (let key in obj) {
            if (key === fieldName) return obj[key];
        }
        return null;
    }

    /**
     * ПАРСИНГ КАТАЛОГА СКЛАДОВ
     */
    parseWarehouseCatalog(data) {
        console.log('📋 Парсинг каталога складов');
        
        if (!Array.isArray(data)) {
            return this.generateFallbackWarehouses();
        }

        return data.map((warehouse, index) => {
            const warehouseName = this.getRussianField(warehouse, 'Склад') || `Склад ${index + 1}`;
            const warehouseId = this.generateIdFromName(warehouseName);
            
            return {
                id: warehouseId,
                name: warehouseName,
                code: this.generateCodeFromName(warehouseName),
                description: this.getRussianField(warehouse, 'Категория склада') || 'Описание отсутствует',
                tireCount: 0,
                tires: [],
                _source: 'warehouse_catalog',
                _original: warehouse
            };
        });
    }

    /**
     * ПАРСИНГ КАТАЛОГА ШИН
     */
    parseTiresCatalog(data) {
        console.log('📋 Парсинг каталога шин');
        
        if (!data.data || !Array.isArray(data.data)) {
            return this.generateFallbackWarehouses();
        }

        const tires = data.data.map((tire, index) => 
            this.normalizeTireFromCatalog(tire, index)
        );

        return [{
            id: 'unassigned_tires',
            name: 'Не распределенные',
            code: 'UNASSIGNED',
            description: 'Шины без привязки к конкретному складу',
            tireCount: tires.length,
            tires: tires,
            _source: 'tires_catalog'
        }];
    }

    /**
     * НОРМАЛИЗАЦИЯ ШИНЫ ИЗ КАТАЛОГА
     */
    normalizeTireFromCatalog(tire, index) {
        console.log('🔧 Нормализация шины из каталога');
        
        const normalizedTire = {
            id: this.getRussianField(tire, 'Заводской номер') || `tire-${index + 1}`,
            subwarehouse: 'А-1',
            row: '1',
            place: (index + 1).toString(),
            number: this.getRussianField(tire, 'Номенклатурный номер') || this.getRussianField(tire, 'Заводской номер') || `ТШ-${index + 1}`,
            brand: this.getRussianField(tire, 'Бренд') || 'Не указан',
            size: this.getRussianField(tire, 'Типоразмер') || 'Не указан',
            oppPlan: this.getRussianField(tire, 'Начальная ОГП') || '—',
            repair: this.getRepairStatus(this.getRussianField(tire, 'Состояние')),
            model: this.getRussianField(tire, 'Модель') || '—',
            mileage: this.getMileageFromCondition(this.getRussianField(tire, 'Состояние')),
            oppActual: this.calculateActualOGP(this.getRussianField(tire, 'Начальная ОГП'), this.getRussianField(tire, 'Состояние')),
            pattern: this.getRussianField(tire, 'Тип рисунка') || '—',
            condition: this.getRussianField(tire, 'Состояние') || '—',
            wear: this.calculateWear(this.getRussianField(tire, 'Состояние')),
            damage: this.getDamageClass(this.getRussianField(tire, 'Состояние')),
            
            _original: tire,
            _metadata: {
                region: this.getRussianField(tire, 'Регион'),
                enterprise: this.getRussianField(tire, 'Предприятие'),
                receiptDate: this.getRussianField(tire, 'Дата поступления'),
                supplier: this.getRussianField(tire, 'Поставщик'),
                cost: this.getRussianField(tire, 'Стоимость'),
                compound: this.getRussianField(tire, 'Компаунд'),
                construction: this.getRussianField(tire, 'Тип конструкции'),
                source: 'tires_catalog'
            }
        };

        return normalizedTire;
    }

    /**
     * ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ ПРЕОБРАЗОВАНИЯ ДАННЫХ
     */
    getRepairStatus(condition) {
        if (!condition) return 'Нет';
        const repairKeywords = ['ремонт', 'восстановлен', 'восстановленная', 'отремонтирован'];
        const conditionLower = condition.toLowerCase();
        return repairKeywords.some(keyword => conditionLower.includes(keyword)) ? 'Да' : 'Нет';
    }

    getMileageFromCondition(condition) {
        if (!condition) return '0 км';
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('нов')) return '0 км';
        if (conditionLower.includes('б/у')) return '50 000 км';
        if (conditionLower.includes('восстанов')) return '75 000 км';
        return '25 000 км';
    }

    calculateActualOGP(initialOGP, condition) {
        if (!initialOGP) return '—';
        const ogpValue = parseInt(initialOGP);
        if (isNaN(ogpValue)) return initialOGP;
        
        let reduction = 0;
        const conditionLower = (condition || '').toLowerCase();
        if (conditionLower.includes('б/у')) reduction = 15;
        if (conditionLower.includes('восстанов')) reduction = 25;
        if (conditionLower.includes('износ')) reduction = 30;
        
        const actualOGP = Math.max(0, ogpValue - reduction);
        return `${actualOGP}%`;
    }

    calculateWear(condition) {
        if (!condition) return '0%';
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('нов')) return '0%';
        if (conditionLower.includes('б/у')) return '25%';
        if (conditionLower.includes('восстанов')) return '40%';
        if (conditionLower.includes('износ')) return '60%';
        return '15%';
    }

    getDamageClass(condition) {
        if (!condition) return 'I';
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('нов')) return 'I';
        if (conditionLower.includes('б/у')) return 'II';
        if (conditionLower.includes('восстанов')) return 'III';
        if (conditionLower.includes('износ')) return 'IV';
        return 'I';
    }

    generateIdFromName(name) {
        if (!name) return 'warehouse';
        return name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    generateCodeFromName(name) {
        if (!name) return 'WH';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 4) || 'WH';
    }

    /**
     * ПОЛУЧЕНИЕ ВСЕХ КЛЮЧЕЙ ИЗ ОБЪЕКТА
     */
    getAllKeys(obj, prefix = '') {
        let keys = [];
        
        if (obj && typeof obj === 'object') {
            for (let key in obj) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                keys.push(fullKey);
                
                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && prefix.split('.').length < 3) {
                    keys = keys.concat(this.getAllKeys(obj[key], fullKey));
                }
            }
        }
        
        return keys;
    }

    /**
     * ПОДСЧЕТ ИНДИКАТОРОВ В КЛЮЧАХ
     */
    countIndicators(keys, indicators) {
        return keys.filter(key => 
            indicators.some(indicator => 
                key.toLowerCase().includes(indicator.toLowerCase())
            )
        ).length;
    }

    /**
     * ПРОВЕРКА - ЭТО ДАННЫЕ ШИНЫ
     */
    isTireData(item) {
        if (!item || typeof item !== 'object') return false;
        
        const tireScore = this.countIndicators(Object.keys(item), this.tireIndicators);
        const warehouseScore = this.countIndicators(Object.keys(item), this.warehouseIndicators);
        
        return tireScore > warehouseScore;
    }

    /**
     * ПРОВЕРКА - ЭТО ДАННЫЕ СКЛАДА
     */
    isWarehouseData(item) {
        if (!item || typeof item !== 'object') return false;
        
        const hasTiresField = item.tires && Array.isArray(item.tires);
        const warehouseScore = this.countIndicators(Object.keys(item), this.warehouseIndicators);
        
        return hasTiresField || warehouseScore > 2;
    }

    /**
     * ПОИСК ВЛОЖЕННЫХ МАССИВОВ
     */
    findNestedArrays(obj, path = '') {
        let arrays = [];
        
        if (obj && typeof obj === 'object') {
            for (let key in obj) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (Array.isArray(obj[key])) {
                    arrays.push({
                        path: currentPath,
                        array: obj[key],
                        key: key
                    });
                } else if (obj[key] && typeof obj[key] === 'object') {
                    if (path.split('.').length < 3) {
                        arrays = arrays.concat(this.findNestedArrays(obj[key], currentPath));
                    }
                }
            }
        }
        
        return arrays;
    }

    /**
     * ПАРСИНГ ФОРМАТА METADATA + DATA
     */
    parseMetadataFormat(data) {
        console.log('📋 Парсинг формата metadata + data');
        
        if (!data.data || !Array.isArray(data.data)) {
            return this.generateFallbackWarehouses();
        }

        const tires = data.data.map((item, index) => 
            this.normalizeTireData(item, index, 'metadata_warehouse')
        );

        return [{
            id: 'metadata_warehouse',
            name: 'Основной склад',
            code: 'WH-MAIN',
            description: 'Данные из JSON с метаданными',
            tireCount: tires.length,
            tires: tires,
            _source: 'metadata_format'
        }];
    }

    /**
     * ПАРСИНГ МАССИВА СКЛАДОВ
     */
    parseWarehousesArray(data) {
        console.log('📋 Парсинг массива складов');
        
        const warehouses = Array.isArray(data) ? data : (data.warehouses || data.data || []);
        
        return warehouses.map((warehouse, index) => {
            const tires = this.extractTiresFromWarehouse(warehouse, index);
            
            return {
                id: this.extractField(warehouse, ['id', 'code', 'key', 'name'], `warehouse-${index + 1}`),
                name: this.extractField(warehouse, ['name', 'title', 'warehouse'], `Склад ${index + 1}`),
                code: this.extractField(warehouse, ['code', 'number'], `WH${index + 1}`),
                description: this.extractField(warehouse, ['description', 'desc'], 'Описание отсутствует'),
                tireCount: tires.length,
                tires: tires,
                _source: 'warehouses_array'
            };
        });
    }

    /**
     * ПАРСИНГ МАССИВА ШИН
     */
    parseTiresArray(data) {
        console.log('📋 Парсинг массива шин');
        
        const tiresArray = Array.isArray(data) ? data : (data.data || data.tires || []);
        const tires = tiresArray.map((tire, index) => 
            this.normalizeTireData(tire, index, 'tires_warehouse')
        );

        const groupedWarehouses = this.groupTiresIntoWarehouses(tires);
        
        return groupedWarehouses.length > 0 ? groupedWarehouses : [{
            id: 'tires_warehouse',
            name: 'Склад шин',
            code: 'WH-TIRES',
            description: 'Шины из массива данных',
            tireCount: tires.length,
            tires: tires,
            _source: 'tires_array'
        }];
    }

    /**
     * ПАРСИНГ ВЛОЖЕННОЙ СТРУКТУРЫ
     */
    parseNestedStructure(data) {
        console.log('📋 Парсинг вложенной структуры');
        
        const nestedArrays = this.findNestedArrays(data);
        let allWarehouses = [];
        
        nestedArrays.forEach(nested => {
            console.log(`🔍 Обработка вложенного массива: ${nested.path}`);
            
            if (this.isWarehouseData(nested.array[0])) {
                const warehouses = this.parseWarehousesArray(nested.array);
                allWarehouses = allWarehouses.concat(warehouses);
            } else if (this.isTireData(nested.array[0])) {
                const warehouse = {
                    id: `nested_${nested.key}`,
                    name: this.formatWarehouseName(nested.key),
                    code: `WH-${nested.key.toUpperCase()}`,
                    description: `Шины из раздела "${nested.key}"`,
                    tireCount: nested.array.length,
                    tires: nested.array.map((tire, index) => 
                        this.normalizeTireData(tire, index, `nested_${nested.key}`)
                    ),
                    _source: 'nested_structure'
                };
                allWarehouses.push(warehouse);
            }
        });
        
        return allWarehouses;
    }

    /**
     * ПАРСИНГ СТРУКТУРЫ КЛЮЧ-ЗНАЧЕНИЕ
     */
    parseKeyValueStructure(data) {
        console.log('📋 Парсинг структуры ключ-значение');
        
        const warehouses = [];
        
        for (let key in data) {
            const value = data[key];
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (this.isWarehouseData(value)) {
                    const tires = this.extractTiresFromWarehouse(value, warehouses.length);
                    warehouses.push({
                        id: key,
                        name: this.formatWarehouseName(key),
                        code: `WH-${key.toUpperCase()}`,
                        description: this.extractField(value, ['description', 'desc'], `Склад ${key}`),
                        tireCount: tires.length,
                        tires: tires,
                        _source: 'key_value_structure'
                    });
                }
            } else if (Array.isArray(value) && value.length > 0 && this.isTireData(value[0])) {
                warehouses.push({
                    id: key,
                    name: this.formatWarehouseName(key),
                    code: `WH-${key.toUpperCase()}`,
                    description: `Шины из раздела "${key}"`,
                    tireCount: value.length,
                    tires: value.map((tire, index) => 
                        this.normalizeTireData(tire, index, key)
                    ),
                    _source: 'key_value_structure'
                });
            }
        }
        
        return warehouses;
    }

    /**
     * ПАРСИНГ СМЕШАННОЙ СТРУКТУРЫ
     */
    parseMixedStructure(data) {
        console.log('📋 Парсинг смешанной структуры');
        
        let allTires = [];
        let allWarehouses = [];
        
        this.collectAllTires(data, allTires);
        
        if (allTires.length > 0) {
            allWarehouses = this.groupTiresIntoWarehouses(allTires);
        }
        
        return allWarehouses;
    }

    /**
     * СБОР ВСЕХ ШИН ИЗ ЛЮБОЙ СТРУКТУРЫ
     */
    collectAllTires(data, collection, path = '') {
        if (!data || typeof data !== 'object') return;
        
        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                if (this.isTireData(item)) {
                    collection.push({
                        data: item,
                        source: path || 'root_array',
                        index: index
                    });
                } else if (item && typeof item === 'object') {
                    this.collectAllTires(item, collection, path ? `${path}[${index}]` : `[${index}]`);
                }
            });
        } else {
            for (let key in data) {
                const value = data[key];
                const currentPath = path ? `${path}.${key}` : key;
                
                if (this.isTireData(value)) {
                    collection.push({
                        data: value,
                        source: currentPath,
                        index: collection.length
                    });
                } else if (value && typeof value === 'object') {
                    this.collectAllTires(value, collection, currentPath);
                }
            }
        }
    }

    /**
     * ПАРСИНГ НЕИЗВЕСТНОГО МАССИВА
     */
    parseUnknownArray(data) {
        console.log('📋 Парсинг неизвестного массива');
        
        if (data.length === 0) return this.generateFallbackWarehouses();
        
        const firstItem = data[0];
        
        if (this.isWarehouseData(firstItem)) {
            return this.parseWarehousesArray(data);
        } else if (this.isTireData(firstItem)) {
            return this.parseTiresArray(data);
        } else {
            const tires = data
                .filter(item => this.isTireData(item))
                .map((tire, index) => this.normalizeTireData(tire, index, 'unknown_array'));
            
            if (tires.length > 0) {
                return [{
                    id: 'unknown_array_warehouse',
                    name: 'Обнаруженные шины',
                    code: 'WH-FOUND',
                    description: 'Шины, найденные в массиве данных',
                    tireCount: tires.length,
                    tires: tires,
                    _source: 'unknown_array'
                }];
            }
        }
        
        return this.generateFallbackWarehouses();
    }

    /**
     * ПАРСИНГ НЕИЗВЕСТНОГО ОБЪЕКТА
     */
    parseUnknownObject(data) {
        console.log('📋 Парсинг неизвестного объекта');
        
        const methods = [
            () => this.parseKeyValueStructure(data),
            () => this.parseNestedStructure(data),
            () => this.parseMixedStructure(data)
        ];
        
        for (let method of methods) {
            try {
                const result = method();
                if (result && result.length > 0) {
                    return result;
                }
            } catch (error) {
                console.warn('⚠️ Метод парсинга не сработал:', error.message);
            }
        }
        
        return this.generateFallbackWarehouses();
    }

    /**
     * УНИВЕРСАЛЬНЫЙ ПАРСИНГ
     */
    parseUniversal(data) {
        console.log('📋 Универсальный парсинг (последняя попытка)');
        
        const dataString = JSON.stringify(data).toLowerCase();
        
        const hasTireKeywords = this.tireIndicators.some(indicator => 
            dataString.includes(indicator.toLowerCase())
        );
        
        if (hasTireKeywords) {
            const allTires = [];
            this.collectAllTires(data, allTires);
            
            if (allTires.length > 0) {
                const tires = allTires.map((item, index) => 
                    this.normalizeTireData(item.data, index, item.source)
                );
                
                return [{
                    id: 'universal_warehouse',
                    name: 'Обнаруженные данные',
                    code: 'WH-UNIVERSAL',
                    description: 'Данные, найденные универсальным парсером',
                    tireCount: tires.length,
                    tires: tires,
                    _source: 'universal_parser'
                }];
            }
        }
        
        return this.generateFallbackWarehouses();
    }

    /**
     * ГРУППИРОВКА ШИН ПО СКЛАДАМ
     */
    groupTiresIntoWarehouses(tires) {
        if (tires.length === 0) return [];
        
        const brands = {};
        tires.forEach(tire => {
            const brand = tire.brand || 'Неизвестный бренд';
            if (!brands[brand]) {
                brands[brand] = [];
            }
            brands[brand].push(tire);
        });
        
        return Object.entries(brands).map(([brand, brandTires], index) => ({
            id: `brand_${brand.toLowerCase().replace(/\s+/g, '_')}`,
            name: `Склад ${brand}`,
            code: `WH-${brand.substring(0, 3).toUpperCase()}`,
            description: `Шины бренда ${brand}`,
            tireCount: brandTires.length,
            tires: brandTires,
            _source: 'auto_grouped_by_brand'
        }));
    }

    /**
     * ИЗВЛЕЧЕНИЕ ШИН ИЗ ДАННЫХ СКЛАДА
     */
    extractTiresFromWarehouse(warehouse, warehouseIndex) {
        const tiresData = this.extractField(warehouse, [
            'tires', 'tireList', 'items', 'data', 
            'tire_data', 'tirelist', 'tireData'
        ], []);
        
        if (Array.isArray(tiresData)) {
            return tiresData.map((tire, index) => 
                this.normalizeTireData(tire, index, `warehouse_${warehouseIndex}`)
            );
        }
        
        return [];
    }

    /**
     * НОРМАЛИЗАЦИЯ ДАННЫХ ШИНЫ
     */
    normalizeTireData(tireData, index, source) {
        const fieldMapping = {
            id: this.findField(tireData, ['id', 'serial', 'number', 'serialnumber']),
            brand: this.findField(tireData, ['brand', 'brandname', 'manufacturer']),
            size: this.findField(tireData, ['size', 'tiresize', 'dimension']),
            model: this.findField(tireData, ['model', 'modelname']),
            
            subwarehouse: this.findField(tireData, ['subwarehouse', 'position', 'pos', 'sector']),
            row: this.findField(tireData, ['row', 'line']),
            place: this.findField(tireData, ['place', 'spot', 'location']),
            number: this.findField(tireData, ['number', 'serial', 'id']),
            
            oppPlan: this.findField(tireData, ['oppPlan', 'plan', 'ogp']),
            repair: this.findField(tireData, ['repair', 'repairStatus']),
            mileage: this.findField(tireData, ['mileage', 'distance']),
            oppActual: this.findField(tireData, ['oppActual', 'actual']),
            pattern: this.findField(tireData, ['pattern', 'treadPattern']),
            condition: this.findField(tireData, ['condition', 'status']),
            wear: this.findField(tireData, ['wear', 'wearPercentage']),
            damage: this.findField(tireData, ['damage', 'damageClass']),
        };

        const normalized = {};
        for (let [key, value] of Object.entries(fieldMapping)) {
            normalized[key] = value || this.getDefaultTireValue(key, index);
        }

        normalized._original = tireData;
        normalized._source = source;

        return normalized;
    }

    /**
     * ПОИСК ПОЛЯ В ДАННЫХ
     */
    findField(data, fieldNames) {
        for (let fieldName of fieldNames) {
            const value = this.extractField(data, [fieldName], null);
            if (value !== null && value !== undefined && value !== '') {
                return value;
            }
        }
        return null;
    }

    /**
     * ИЗВЛЕЧЕНИЕ ПОЛЯ
     */
    extractField(obj, fieldNames, defaultValue) {
        for (let fieldName of fieldNames) {
            if (obj && obj[fieldName] !== undefined && obj[fieldName] !== null && obj[fieldName] !== '') {
                return obj[fieldName];
            }
            
            const lowerFieldName = fieldName.toLowerCase();
            for (let key in obj) {
                if (key.toLowerCase() === lowerFieldName && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
                    return obj[key];
                }
            }
            
            if (obj && typeof obj === 'object') {
                for (let key in obj) {
                    if (obj[key] && typeof obj[key] === 'object') {
                        const nestedValue = this.extractField(obj[key], [fieldName], null);
                        if (nestedValue !== null) {
                            return nestedValue;
                        }
                    }
                }
            }
        }
        
        return defaultValue;
    }

    /**
     * ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ ДЛЯ ШИН
     */
    getDefaultTireValue(field, index) {
        const defaults = {
            id: `tire-${index + 1}`,
            subwarehouse: 'А-1',
            row: '1',
            place: (index + 1).toString(),
            number: `ТШ-${index + 1}`,
            brand: 'Не указан',
            size: 'Не указан',
            oppPlan: '100%',
            repair: 'Нет',
            model: '—',
            mileage: '0 км',
            oppActual: '100%',
            pattern: '—',
            condition: 'Новая',
            wear: '0%',
            damage: 'I'
        };
        
        return defaults[field] || '—';
    }

    /**
     * ФОРМАТИРОВАНИЕ НАЗВАНИЯ СКЛАДА
     */
    formatWarehouseName(key) {
        const nameMap = {
            'main': 'Основной склад',
            'reserve': 'Резервный склад',
            'warehouse': 'Склад',
            'tires': 'Склад шин',
            'storage': 'Хранилище',
            'default': 'Склад'
        };
        
        return nameMap[key.toLowerCase()] || `Склад ${key}`;
    }

    /**
     * ФИЛЬТРАЦИЯ И ВАЛИДАЦИЯ СКЛАДОВ
     */
    filterAndValidateWarehouses(warehouses) {
        return warehouses
            .filter(warehouse => 
                warehouse && 
                warehouse.name &&
                warehouse.tires && 
                Array.isArray(warehouse.tires)
            )
            .map(warehouse => ({
                ...warehouse,
                tireCount: warehouse.tires.length
            }));
    }

    /**
     * РЕЗЕРВНЫЕ ДАННЫЕ
     */
    generateFallbackWarehouses() {
        console.log('🔄 Генерация резервных данных');
        
        return [
            {
                id: 'fallback_warehouse',
                name: 'Демо склад',
                code: 'WH-DEMO',
                description: 'Резервные данные (парсинг не удался)',
                tireCount: 2,
                tires: [
                    {
                        id: 'demo-tire-1',
                        subwarehouse: 'А-1',
                        row: '1',
                        place: '1',
                        number: 'ДЕМО-001',
                        brand: 'Bridgestone',
                        size: '33.00R51',
                        oppPlan: '78%',
                        repair: 'Нет',
                        model: 'VRLS',
                        mileage: '0 км',
                        oppActual: '78%',
                        pattern: 'E4',
                        condition: 'Новое',
                        wear: '0%',
                        damage: 'I'
                    }
                ],
                _source: 'fallback_data'
            },
            {
                id: 'fallback_unassigned',
                name: 'Не распределенные',
                code: 'UNASSIGNED',
                description: 'Резервные нераспределенные шины',
                tireCount: 1,
                tires: [
                    {
                        id: 'demo-unassigned-1',
                        subwarehouse: 'А-1',
                        row: '1',
                        place: '1',
                        number: 'ДЕМО-UN-001',
                        brand: 'Michelin',
                        size: '33.00R51',
                        oppPlan: '82%',
                        repair: 'Нет',
                        model: 'XDR2',
                        mileage: '0 км',
                        oppActual: '82%',
                        pattern: 'E3',
                        condition: 'Новое',
                        wear: '0%',
                        damage: 'I'
                    }
                ],
                _source: 'fallback_unassigned'
            }
        ];
    }
}

// Создаем глобальный экземпляр парсера
window.warehouseParser = new UniversalWarehouseParser();