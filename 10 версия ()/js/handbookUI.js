// js/handbookUI.js
window.HandbookUI = {
    currentHandbook: null,
    editingHandbook: null,
    selectedHandbooks: new Set(), // Для массовых операций

    init() {
        console.log('🔄 Инициализация HandbookUI...');
        
        if (!this.checkDependencies()) {
            console.error('❌ HandbookUI: Отсутствуют необходимые зависимости');
            return;
        }
        
        this.initHandbooksTab();
        this.initEventListeners();
        this.updateHandbookMenu();
        console.log('✅ HandbookUI инициализирован');
    },

    checkDependencies() {
        const deps = {
            'HandbookStore': window.HandbookStore,
            'FieldBuilder': window.FieldBuilder,
            'DataTable': window.DataTable,
            'PendingChanges': window.PendingChanges
        };
        
        for (const [name, dep] of Object.entries(deps)) {
            if (!dep) {
                console.error(`❌ Отсутствует зависимость: ${name}`);
                return false;
            }
        }
        return true;
    },

    initHandbooksTab() {
        const handbooksTab = document.getElementById('handbooks');
        if (!handbooksTab) {
            console.error('❌ Вкладка справочников не найдена');
            return;
        }

        handbooksTab.innerHTML = `
            <div class="admin-header fixed-header">
                <h3>Управление справочниками</h3>
                <p>Создавайте и редактируйте справочники системы</p>
            </div>
            
            <div class="handbooks-container">
                <!-- Массовые операции -->
                <div class="bulk-actions" style="display: none;" id="bulkActions">
                    <div class="bulk-actions-header">
                        <strong>Выбрано: <span id="selectedCount">0</span> справочников</strong>
                        <div class="bulk-buttons">
                            <button id="bulkExportBtn" class="btn-secondary">
                                <i class="fas fa-download"></i> Экспорт выбранных
                            </button>
                            <button id="bulkDeleteBtn" class="btn-danger">
                                <i class="fas fa-trash"></i> Удалить выбранные
                            </button>
                            <button id="clearSelectionBtn" class="btn-secondary">
                                <i class="fas fa-times"></i> Снять выделение
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Действия -->
                <div class="handbooks-actions">
                    <button id="addHandbookBtn" class="btn-primary">
                        <i class="fas fa-plus"></i> Добавить справочник
                    </button>
                    <button id="importHandbookBtn" class="btn-secondary">
                        <i class="fas fa-upload"></i> Импорт
                    </button>
                    <button id="exportAllHandbooksBtn" class="btn-secondary">
                        <i class="fas fa-download"></i> Экспорт всех
                    </button>
                    <button id="toggleSelectionBtn" class="btn-secondary">
                        <i class="fas fa-check-square"></i> Выбрать несколько
                    </button>
                </div>

                <!-- Список справочников -->
                <div id="handbookList" class="handbook-list-section">
                    <!-- Динамически заполняется -->
                </div>

                <!-- Форма создания/редактирования -->
                <div id="handbookForm" class="handbook-form-section" style="display: none;">
                    <!-- Динамически заполняется -->
                </div>

                <!-- Данные справочника -->
                <div id="handbookData" class="handbook-data-section" style="display: none;">
                    <div class="handbook-data-header fixed-header">
                        <h3 id="handbookDataTitle"></h3>
                        <div class="handbook-data-actions">
                            <button id="addRowBtn" class="btn-primary">
                                <i class="fas fa-plus"></i> Добавить запись
                            </button>
                            <button id="editHandbookStructureBtn" class="btn-secondary">
                                <i class="fas fa-edit"></i> Редактировать структуру
                            </button>
                            <button id="exportDataBtn" class="btn-secondary">
                                <i class="fas fa-download"></i> Экспорт данных
                            </button>
                            <button id="backToListBtn" class="btn-secondary">
                                <i class="fas fa-arrow-left"></i> К списку
                            </button>
                        </div>
                    </div>
                    <div class="handbook-data-table-container">
                        <table id="handbookDataTable" class="handbook-data-table"></table>
                    </div>
                </div>

                <!-- Форма записи -->
                <div id="rowFormContainer" class="row-form-section" style="display: none;">
                    <div class="admin-header fixed-header">
                        <h3 id="rowFormTitle">Добавление записи</h3>
                    </div>
                    <form id="rowForm">
                        <div id="rowFormFields"></div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Сохранить</button>
                            <button type="button" id="cancelRowFormBtn" class="btn-secondary">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.initHandbooksCore();
    },

    initHandbooksCore() {
        this.showHandbookList();
        this.initHandbookEventListeners();
        console.log('✅ Ядро справочников инициализировано');
    },

    initHandbookEventListeners() {
        const $ = (sel) => document.querySelector(sel);
        const on = (el, ev, handler) => el && el.addEventListener(ev, handler);

        // Основные кнопки
        on($('#addHandbookBtn'), 'click', () => this.showEditHandbookForm());
        on($('#importHandbookBtn'), 'click', () => this.importHandbook());
        on($('#exportAllHandbooksBtn'), 'click', () => this.exportAllHandbooks());
        on($('#toggleSelectionBtn'), 'click', () => this.toggleSelectionMode());

        // Массовые операции
        on($('#bulkExportBtn'), 'click', () => this.bulkExport());
        on($('#bulkDeleteBtn'), 'click', () => this.bulkDelete());
        on($('#clearSelectionBtn'), 'click', () => this.clearSelection());

        // Кнопки в режиме данных
        on($('#editHandbookStructureBtn'), 'click', () => {
            if (this.currentHandbook) {
                this.showEditHandbookForm(this.currentHandbook);
            }
        });

        // Инициализация DataTable
        if (window.DataTable && window.DataTable.initDataTableHandlers) {
            window.DataTable.initDataTableHandlers();
        }
    },

    showHandbookList() {
        const $ = (sel) => document.querySelector(sel);
        const hide = (el) => el && (el.style.display = 'none');
        const show = (el) => el && (el.style.display = 'block');

        hide($('#handbookForm'));
        hide($('#handbookData'));
        hide($('#rowFormContainer'));
        
        const handbookList = $('#handbookList');
        if (handbookList) {
            show(handbookList);
            this.renderHandbookList();
        }
    },

    renderHandbookList() {
        const handbookList = document.getElementById('handbookList');
        if (!handbookList) return;

        if (!window.HandbookStore || !window.HandbookStore.getAllHandbookNames) {
            handbookList.innerHTML = `
                <div class="error-message">
                    <p>❌ Ошибка: Модуль справочников не загружен</p>
                </div>
            `;
            return;
        }

        const handbooks = window.HandbookStore.getAllHandbookNames();
        
        if (handbooks.length === 0) {
            handbookList.innerHTML = `
                <div class="no-data">
                    <p>📚 Справочники не найдены</p>
                    <p>Создайте первый справочник или импортируйте существующие</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Всего справочников</span>
                    <span class="stat-value">${handbooks.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Всего записей</span>
                    <span class="stat-value">${this.getTotalRecordsCount(handbooks)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Несохраненные</span>
                    <span class="stat-value">${this.getUnsavedCount()}</span>
                </div>
            </div>
            <div class="handbooks-list">
        `;

        handbooks.forEach(name => {
            const handbook = window.HandbookStore.loadHandbook(name);
            const fieldsCount = handbook?.fields?.length || 0;
            const recordsCount = handbook?.data?.length || 0;
            const updatedAt = handbook?.updatedAt ? new Date(handbook.updatedAt).toLocaleDateString('ru-RU') : 'неизвестно';

            const hasChanges = window.PendingChanges?.pendingChanges?.handbooks?.[name] && 
                             !window.PendingChanges.pendingChanges.handbooks[name]._deleted;

            const isSelected = this.selectedHandbooks.has(name);

            html += `
                <div class="handbook-item ${isSelected ? 'selected' : ''}" data-handbook="${name}">
                    <div class="handbook-header">
                        <div class="handbook-title">
                            ${this.selectionMode ? `
                                <input type="checkbox" class="handbook-checkbox" ${isSelected ? 'checked' : ''} 
                                       data-handbook="${name}" onchange="HandbookUI.toggleHandbookSelection('${name}')">
                            ` : ''}
                            <h4>${name} ${hasChanges ? '<span class="unsaved-indicator">⚡</span>' : ''}</h4>
                        </div>
                        <span class="handbook-meta">Обновлен: ${updatedAt}</span>
                    </div>
                    <div class="handbook-info">
                        <p>Поля: ${fieldsCount} | Записей: ${recordsCount}</p>
                        ${handbook?.fields?.some(f => f.type === 'reference') ? '<span class="reference-badge">📎 Есть ссылки</span>' : ''}
                    </div>
                    <div class="handbook-item-actions">
                        <button class="btn-small open" data-handbook="${name}">
                            <i class="fas fa-table"></i> Данные
                        </button>
                        <button class="btn-small edit" data-handbook="${name}">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn-small export" data-handbook="${name}">
                            <i class="fas fa-download"></i> Экспорт
                        </button>
                        <button class="btn-small delete" data-handbook="${name}">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        handbookList.innerHTML = html;

        this.attachHandbookListHandlers();
        this.updateBulkActions();
    },

    // Массовые операции
    toggleSelectionMode() {
        this.selectionMode = !this.selectionMode;
        this.selectedHandbooks.clear();
        
        const btn = document.getElementById('toggleSelectionBtn');
        if (btn) {
            btn.innerHTML = this.selectionMode ? 
                '<i class="fas fa-times"></i> Отменить выбор' : 
                '<i class="fas fa-check-square"></i> Выбрать несколько';
            btn.classList.toggle('btn-primary', this.selectionMode);
        }
        
        this.renderHandbookList();
    },

    toggleHandbookSelection(name) {
        if (this.selectedHandbooks.has(name)) {
            this.selectedHandbooks.delete(name);
        } else {
            this.selectedHandbooks.add(name);
        }
        this.updateBulkActions();
    },

    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (bulkActions && selectedCount) {
            const count = this.selectedHandbooks.size;
            selectedCount.textContent = count;
            
            if (count > 0 && this.selectionMode) {
                bulkActions.style.display = 'block';
            } else {
                bulkActions.style.display = 'none';
            }
        }
    },

    bulkExport() {
        if (this.selectedHandbooks.size === 0) return;
        
        const names = Array.from(this.selectedHandbooks);
        const exportData = window.HandbookStore.exportMultipleHandbooks(names);
        
        this.downloadJson(exportData, `pazl-handbooks-${names.length}-${new Date().toISOString().slice(0, 10)}.json`);
        this.showNotification(`Экспортировано ${names.length} справочников`, 'success');
    },

    bulkDelete() {
        if (this.selectedHandbooks.size === 0) return;
        
        const names = Array.from(this.selectedHandbooks);
        if (!confirm(`Удалить ${names.length} справочников?`)) return;
        
        names.forEach(name => {
            window.HandbookStore.deleteHandbook(name);
        });
        
        this.selectedHandbooks.clear();
        this.showNotification(`Удалено ${names.length} справочников`, 'success');
        this.showHandbookList();
    },

    clearSelection() {
        this.selectedHandbooks.clear();
        this.updateBulkActions();
        this.renderHandbookList();
    },

    getTotalRecordsCount(handbooks) {
        return handbooks.reduce((total, name) => {
            const handbook = window.HandbookStore.loadHandbook(name);
            return total + (handbook?.data?.length || 0);
        }, 0);
    },

    getUnsavedCount() {
        const changes = window.PendingChanges?.pendingChanges?.handbooks || {};
        return Object.keys(changes).length;
    },

    attachHandbookListHandlers() {
        const $$ = (sel) => Array.from(document.querySelectorAll(sel));
        const on = (el, ev, handler) => el && el.addEventListener(ev, handler);

        // Обработчики кнопок
        const attachHandlers = (selector, handler) => {
            $$(selector).forEach(btn => {
                on(btn, 'click', (e) => {
                    e.stopPropagation();
                    const name = btn.getAttribute('data-handbook');
                    handler(name);
                });
            });
        };

        attachHandlers('.btn-small.open', (name) => this.openHandbook(name));
        attachHandlers('.btn-small.edit', (name) => this.showEditHandbookForm(name));
        attachHandlers('.btn-small.export', (name) => this.exportHandbook(name));
        attachHandlers('.btn-small.delete', (name) => this.deleteHandbook(name));

        // Клик по элементу (только если не в режиме выбора)
        $$('.handbook-item').forEach(item => {
            on(item, 'click', (e) => {
                if (!this.selectionMode && !e.target.closest('.btn-small') && !e.target.closest('.handbook-checkbox')) {
                    const name = item.getAttribute('data-handbook');
                    this.openHandbook(name);
                }
            });
        });
    },

    openHandbook(name) {
        this.setCurrentHandbook(name);
        
        if (window.DataTable && window.DataTable.showHandbookData) {
            window.DataTable.showHandbookData(name);
        } else {
            this.showNotification('Ошибка: модуль таблиц не загружен', 'error');
        }
    },

    exportHandbook(name) {
        try {
            const exportData = window.HandbookStore.exportHandbook(name);
            this.downloadJson(exportData, `${name}.json`);
            this.showNotification(`Справочник "${name}" экспортирован`, 'success');
        } catch (error) {
            this.showNotification('Ошибка при экспорте', 'error');
        }
    },

    exportAllHandbooks() {
        const handbooks = window.HandbookStore.getAllHandbookNames();
        if (handbooks.length === 0) {
            this.showNotification('Нет справочников для экспорта', 'warning');
            return;
        }

        const exportData = window.HandbookStore.exportAllHandbooks();
        this.downloadJson(exportData, `pazl-all-handbooks-${new Date().toISOString().slice(0, 10)}.json`);
        this.showNotification(`Экспортировано ${handbooks.length} справочников`, 'success');
    },

    downloadJson(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    showEditHandbookForm(handbookName = null) {
        const $ = (sel) => document.querySelector(sel);
        const hide = (el) => el && (el.style.display = 'none');
        const show = (el) => el && (el.style.display = 'block');

        this.editingHandbook = handbookName;
        const handbookForm = $('#handbookForm');
        
        if (!handbookForm) return;

        hide($('#handbookList'));
        hide($('#handbookData'));
        show(handbookForm);

        const title = handbookName ? `Редактирование справочника "${handbookName}"` : 'Создание нового справочника';
        handbookForm.innerHTML = `
            <div class="admin-header fixed-header">
                <h3>${title}</h3>
                <p>Определите структуру данных справочника</p>
            </div>
            
            <form id="createHandbookForm">
                <div class="form-group">
                    <label class="form-label">Название справочника:</label>
                    <input type="text" id="handbookName" class="form-input" 
                           value="${handbookName || ''}" 
                           ${handbookName ? 'readonly' : ''} 
                           placeholder="Введите название справочника" required>
                    <div class="form-help">Название должно быть уникальным</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Структура полей:</label>
                    <div class="field-definitions-container">
                        <div id="fieldDefinitions"></div>
                        <button type="button" id="addFieldBtn" class="btn-secondary" style="margin-top: 15px;">
                            <i class="fas fa-plus"></i> Добавить поле
                        </button>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> ${handbookName ? 'Обновить' : 'Создать'} справочник
                    </button>
                    <button type="button" id="cancelHandbookForm" class="btn-secondary">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                </div>
            </form>
        `;

        // Инициализация FieldBuilder
        if (window.FieldBuilder) {
            window.FieldBuilder.resetFieldCounters();
            
            if (handbookName) {
                const handbook = window.HandbookStore.loadHandbook(handbookName);
                if (handbook && handbook.fields) {
                    handbook.fields.forEach(field => {
                        const fieldId = window.FieldBuilder.addFieldDefinition(field.type);
                        this.populateFieldData(fieldId, field);
                    });
                }
            }

            const addFieldBtn = $('#addFieldBtn');
            if (addFieldBtn) {
                addFieldBtn.onclick = () => window.FieldBuilder.addFieldDefinition();
            }
        }

        const form = $('#createHandbookForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                if (window.FieldBuilder && window.FieldBuilder.handleCreateHandbook) {
                    window.FieldBuilder.handleCreateHandbook(e, this.editingHandbook, this.currentHandbook);
                }
            };
        }

        const cancelBtn = $('#cancelHandbookForm');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.setEditingHandbook(null);
                this.showHandbookList();
            };
        }
    },

    populateFieldData(fieldId, fieldData) {
        const $ = (sel) => document.querySelector(sel);

        $(`[name="field_name_${fieldId}"]`).value = fieldData.name || '';
        $(`[name="field_type_${fieldId}"]`).value = fieldData.type || 'string';
        $(`[name="field_unit_${fieldId}"]`).value = fieldData.unit || '';

        if (window.FieldBuilder && window.FieldBuilder.toggleFieldType) {
            window.FieldBuilder.toggleFieldType(fieldId);
        }

        if (fieldData.type === 'reference' && fieldData.reference) {
            $(`[name="reference_handbook_${fieldId}"]`).value = fieldData.reference.handbook || '';
            $(`[name="reference_field_${fieldId}"]`).value = fieldData.reference.field || '';
        }

        if (fieldData.type === 'group' && fieldData.fields) {
            fieldData.fields.forEach(subField => {
                const subFieldId = window.FieldBuilder.addSubField(fieldId);
                $(`[name="subfield_name_${fieldId}_${subFieldId}"]`).value = subField.name || '';
                $(`[name="subfield_type_${fieldId}_${subFieldId}"]`).value = subField.type || 'string';
                $(`[name="subfield_unit_${fieldId}_${subFieldId}"]`).value = subField.unit || '';

                if (window.FieldBuilder && window.FieldBuilder.toggleSubfieldType) {
                    window.FieldBuilder.toggleSubfieldType(fieldId, subFieldId);
                }

                if (subField.type === 'reference' && subField.reference) {
                    $(`[name="subfield_reference_handbook_${fieldId}_${subFieldId}"]`).value = subField.reference.handbook || '';
                    $(`[name="subfield_reference_field_${fieldId}_${subFieldId}"]`).value = subField.reference.field || '';
                }
            });
        }
    },

    deleteHandbook(name) {
        if (!confirm(`Удалить справочник "${name}"?`)) return;

        window.HandbookStore.deleteHandbook(name);
        this.showNotification(`Справочник "${name}" удален`, 'success');
        this.showHandbookList();
    },

    importHandbook() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.multiple = true; // Разрешаем multiple
        fileInput.style.display = 'none';
        
        fileInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            let totalImported = 0;
            let totalFiles = files.length;

            for (const file of files) {
                try {
                    const result = await this.processImportFile(file);
                    if (result) totalImported++;
                } catch (error) {
                    console.error(`Ошибка импорта файла ${file.name}:`, error);
                }
            }

            if (totalImported > 0) {
                this.showNotification(`Импортировано ${totalImported} из ${totalFiles} файлов`, 'success');
                this.showHandbookList();
            } else {
                this.showNotification('Не удалось импортировать файлы', 'error');
            }
        };

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    },

    processImportFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);
                    const baseName = file.name.replace('.json', '');
                    
                    // Пытаемся импортировать как коллекцию
                    if (window.HandbookStore.importHandbookCollection(jsonData)) {
                        resolve(true);
                    }
                    // Импортируем как одиночный справочник
                    else if (window.HandbookStore.importHandbook(baseName, jsonData)) {
                        resolve(true);
                    } else {
                        reject(new Error('Не удалось обработать файл'));
                    }
                } catch (parseError) {
                    reject(parseError);
                }
            };
            
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    },

    setCurrentHandbook(name) {
        this.currentHandbook = name;
    },

    getCurrentHandbook() {
        return this.currentHandbook;
    },

    setEditingHandbook(name) {
        this.editingHandbook = name;
    },

    updateHandbookMenu() {
        console.log('🔄 Обновление меню справочников');
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} slide-in`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    },

    initEventListeners() {
        console.log('✅ Глобальные обработчики HandbookUI инициализированы');
    }
};

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.HandbookUI) {
                window.HandbookUI.init();
            }
        }, 500);
    });
} else {
    setTimeout(() => {
        if (window.HandbookUI) {
            window.HandbookUI.init();
        }
    }, 500);
}

console.log('✅ HandbookUI загружен');