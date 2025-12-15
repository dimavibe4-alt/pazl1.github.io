// js/AppUtils.js
window.AppUtils = {
    // Селекторы
    $: (selector, context = document) => context.querySelector(selector),
    $$: (selector, context = document) => Array.from(context.querySelectorAll(selector)),
    
    // Обработчики событий
    on: (el, event, handler, options) => el && el.addEventListener(event, handler, options),
    
    // Ключ для localStorage
    LS_KEY: 'handbooks',
    
    // Вспомогательные функции
    show: (el) => { if (el) el.style.display = 'block'; },
    hide: (el) => { if (el) el.style.display = 'none'; },
    toggle: (el, condition) => { if (el) el.style.display = condition ? 'block' : 'none'; },
    
    // Форматирование
    formatDate: (date) => new Date(date).toLocaleDateString('ru-RU'),
    formatDateTime: (date) => new Date(date).toLocaleString('ru-RU'),
    
    // Валидация
    isValidString: (str) => str && typeof str === 'string' && str.trim().length > 0,
    isValidArray: (arr) => arr && Array.isArray(arr)
};

console.log('✅ AppUtils загружен');