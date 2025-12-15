// js/pendingChanges.js
window.PendingChanges = {
    pendingChanges: {
        handbooks: {}
    },
    isUnsaved: false,

    init() {
        console.log('🔄 Инициализация PendingChanges...');
        
        // Проверяем зависимости
        if (!this.checkDependencies()) {
            console.error('❌ PendingChanges: Отсутствуют необходимые зависимости');
            return;
        }
        
        this.updateUI();
        this.initEventListeners();
        console.log('✅ PendingChanges инициализирован');
    },

    checkDependencies() {
        const required = ['HandbookStore'];
        for (const dep of required) {
            if (!window[dep]) {
                console.error(`❌ Отсутствует зависимость: ${dep}`);
                return false;
            }
        }
        return true;
    },

    // Методы для совместимости с admin.js
    hasPendingChanges() {
        return this.hasChanges();
    },

    getPendingChangesCount() {
        return this.getChangesCount();
    },

    markChangesUnsaved() {
        this.isUnsaved = true;
        this.updateUI();
    },

    markChangesSaved() {
        this.isUnsaved = false;
        this.pendingChanges = { handbooks: {} };
        this.updateUI();
        console.log('✅ Все изменения сохранены, состояние сброшено');
    },

    async saveChanges() {
        if (!this.hasChanges()) {
            this.showNotification('Нет изменений для сохранения', 'info');
            return;
        }

        // Показываем подтверждение
        if (!confirm(`Сохранить ${this.getChangesCount()} изменений в JSON файлы?`)) {
            return;
        }

        const results = {
            saved: 0,
            errors: 0
        };

        // Сохраняем изменения справочников
        for (const [name, data] of Object.entries(this.pendingChanges.handbooks)) {
            try {
                if (data._deleted) {
                    // Удаление справочника
                    const success = await this.processHandbookDeletion(name);
                    if (success) {
                        results.saved++;
                    } else {
                        results.errors++;
                    }
                } else {
                    // Сохранение/обновление справочника
                    const success = await this.processHandbookSave(name, data);
                    if (success) {
                        results.saved++;
                    } else {
                        results.errors++;
                    }
                }
            } catch (error) {
                console.error(`❌ Ошибка обработки справочника "${name}":`, error);
                results.errors++;
            }
        }

        // Обновляем UI и показываем результаты
        this.updateUI();
        
        if (results.errors === 0) {
            this.markChangesSaved(); // ✅ ВАЖНО: сбрасываем состояние!
            this.showNotification(`Все изменения сохранены (${results.saved} справочников)`, 'success');
            
            // Обновляем список справочников
            if (window.HandbookUI && window.HandbookUI.showHandbookList) {
                window.HandbookUI.showHandbookList();
            }
        } else {
            this.showNotification(`Сохранено ${results.saved} справочников, ошибок: ${results.errors}`, 'warning');
        }
    },

    async processHandbookSave(name, data) {
        try {
            // Сохраняем в localStorage
            if (window.HandbookStore && window.HandbookStore.originalSaveHandbook) {
                window.HandbookStore.originalSaveHandbook(name, data);
            }
            
            // Пытаемся сохранить в JSON файлы
            if (window.HandbookStore && window.HandbookStore.saveToJsonFiles) {
                const fileSaved = await window.HandbookStore.saveToJsonFiles(name, data);
                
                if (fileSaved) {
                    console.log(`✅ Справочник "${name}" сохранен в файл`);
                } else {
                    console.log(`ℹ️ Справочник "${name}" сохранен только в localStorage`);
                }
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Ошибка сохранения справочника "${name}":`, error);
            return false;
        }
    },

    async processHandbookDeletion(name) {
        try {
            // Удаляем из localStorage
            if (window.HandbookStore && window.HandbookStore.originalDeleteHandbook) {
                window.HandbookStore.originalDeleteHandbook(name);
            }
            
            console.log(`🗑️ Справочник "${name}" удален из localStorage`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка удаления справочника "${name}":`, error);
            return false;
        }
    },

    hasChanges() {
        const handbookChanges = Object.keys(this.pendingChanges.handbooks).length;
        return handbookChanges > 0;
    },

    getChangesCount() {
        return Object.keys(this.pendingChanges.handbooks).length;
    },

    updateUI() {
        const changesCount = this.getChangesCount();
        const saveBtn = document.getElementById('saveChangesBtn');
        const badge = document.getElementById('changesCountBadge');
        
        if (saveBtn) {
            if (changesCount > 0) {
                saveBtn.style.display = 'inline-block';
                saveBtn.innerHTML = `<i class="fas fa-save"></i> Сохранить изменения (${changesCount})`;
                saveBtn.disabled = false;
            } else {
                saveBtn.style.display = 'none';
            }
        }
        
        if (badge) {
            if (changesCount > 0) {
                badge.textContent = changesCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Обновляем список справочников, если он открыт
        if (window.HandbookUI && window.HandbookUI.renderHandbookList) {
            setTimeout(() => {
                window.HandbookUI.renderHandbookList();
            }, 100);
        }
    },

    showNotification(message, type = 'info') {
        // Используем уведомления HandbookUI если доступны
        if (window.HandbookUI && window.HandbookUI.showNotification) {
            window.HandbookUI.showNotification(message, type);
        } else {
            // Фолбэк уведомление
            console.log(`${type.toUpperCase()}: ${message}`);
            // Не используем alert чтобы не блокировать интерфейс
        }
    },

    initEventListeners() {
        const saveBtn = document.getElementById('saveChangesBtn');
        if (saveBtn) {
            // Удаляем старые обработчики и добавляем новый
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.addEventListener('click', () => this.saveChanges());
        }
    }
};

// Автоматическая инициализация с задержкой для загрузки зависимостей
setTimeout(() => {
    if (window.PendingChanges && window.PendingChanges.init) {
        window.PendingChanges.init();
    }
}, 1000);