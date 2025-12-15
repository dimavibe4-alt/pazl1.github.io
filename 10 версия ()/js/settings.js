// js/settings.js
class SettingsModule {
    constructor() {
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.adminBtn = document.getElementById('adminBtn');
        this.adminLoginModal = document.getElementById('adminLoginModal');
        this.adminPanelModal = document.getElementById('adminPanelModal');
        this.adminLoginForm = document.getElementById('adminLoginForm');
        
        this.init();
    }

    init() {
        this.bindEvents();
        console.log('⚙️ Модуль настроек инициализирован');
    }

    bindEvents() {
        // Открытие настроек
        if (this.settingsBtn && this.settingsModal) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Кнопка Admin в настройках
        if (this.adminBtn) {
            this.adminBtn.addEventListener('click', () => this.openAdminLogin());
        }

        // Обработка формы входа в админку
        if (this.adminLoginForm) {
            this.adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }

        // Закрытие модальных окон
        this.bindModalCloseEvents();
    }

    openSettings() {
        console.log('📋 Открытие настроек системы');
        if (this.settingsModal) {
            this.settingsModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    openAdminLogin() {
        console.log('🔐 Открытие админ-панели');
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
        if (this.adminLoginModal) {
            this.adminLoginModal.style.display = 'flex';
        }
    }

    handleAdminLogin(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        // Простая проверка (в реальности должно быть сложнее)
        if (username === 'admin' && password === 'admin') {
            if (this.adminLoginModal) {
                this.adminLoginModal.style.display = 'none';
            }
            if (this.adminPanelModal) {
                this.adminPanelModal.style.display = 'flex';
            }
        } else {
            alert('Неверные логин или пароль');
        }
    }

    bindModalCloseEvents() {
        // Закрытие через крестик
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => this.closeModal(e.target));
        });

        // Закрытие по клику вне модального окна
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    closeModal(element) {
        const modal = element.closest('.modal-overlay');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

// Глобальная функция для открытия настроек
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

window.openSettingsModal = openSettingsModal;

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    new SettingsModule();
});