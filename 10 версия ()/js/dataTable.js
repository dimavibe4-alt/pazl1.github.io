// js/dataTable.js
/* dataTable.js - Управление таблицами данных справочников */

function showHandbookData(name) {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const hide = (el) => el && (el.style.display = 'none');
    const show = (el) => el && (el.style.display = 'block');

    window.HandbookUI.setCurrentHandbook(name);
    const hb = window.HandbookStore.loadHandbook(name);
    if (!hb) { 
        alert('Справочник не найден'); 
        return; 
    }

    hide($('#handbookList'));
    hide($('#handbookForm'));
    hide($('#rowFormContainer'));
    show($('#handbookData'));

    // Помечаем несохранённые изменения
    const unsaved = window.PendingChanges && 
                   window.PendingChanges.pendingChanges.handbooks[name] &&
                   !window.PendingChanges.pendingChanges.handbooks[name]._deleted ? 
                   ' ⚡' : '';
    
    $('#handbookDataTitle').textContent = name + unsaved;

    const table = $('#handbookDataTable');
    if (!table) return;

    // Очищаем таблицу
    table.innerHTML = '';

    // Создаем структуру таблиды
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);

    // Создаем заголовки
    const topRow = document.createElement('tr');
    const subRow = document.createElement('tr');
    thead.appendChild(topRow);
    thead.appendChild(subRow);

    let colSpanTotal = 0;

    // Заполняем заголовки на основе структуры полей
    hb.fields.forEach(f => {
        if (f.type === 'group') {
            const subfieldsCount = (f.fields || []).length;
            const th = document.createElement('th');
            th.className = 'group-header';
            th.colSpan = subfieldsCount;
            th.textContent = f.name;
            topRow.appendChild(th);

            // Добавляем подзаголовки для подполей
            (f.fields || []).forEach(sf => {
                const th2 = document.createElement('th');
                th2.className = 'sub-header';
                th2.innerHTML = sf.unit ? `${sf.name}<br><small>${sf.unit}</small>` : sf.name;
                subRow.appendChild(th2);
            });

            colSpanTotal += subfieldsCount;
        } else {
            const th = document.createElement('th');
            th.className = 'single-header';
            th.rowSpan = 2;
            th.innerHTML = f.unit ? `${f.name}<br><small>${f.unit}</small>` : f.name;
            topRow.appendChild(th);
            colSpanTotal += 1;
        }
    });

    // Колонка «Действия»
    const actionsTh = document.createElement('th');
    actionsTh.className = 'single-header';
    actionsTh.rowSpan = 2;
    actionsTh.textContent = 'Действия';
    topRow.appendChild(actionsTh);

    // Заполняем данные
    if (hb.data && hb.data.length > 0) {
        hb.data.forEach((row, idx) => {
            const tr = document.createElement('tr');
            tbody.appendChild(tr);

            // Добавляем ячейки данных
            hb.fields.forEach(f => {
                if (f.type === 'group') {
                    (f.fields || []).forEach(sf => {
                        const td = document.createElement('td');
                        const value = row?.[f.name]?.[sf.name] ?? '';
                        td.textContent = formatCellValue(value, sf.type);
                        tr.appendChild(td);
                    });
                } else {
                    const td = document.createElement('td');
                    const value = row?.[f.name] ?? '';
                    td.textContent = formatCellValue(value, f.type);
                    tr.appendChild(td);
                }
            });

            // Ячейка действий
            const tdAct = document.createElement('td');
            tdAct.className = 'actions-cell';
            tdAct.innerHTML = `
                <button class="btn-small edit" data-row="${idx}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn-small delete" data-row="${idx}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            `;
            tr.appendChild(tdAct);
        });
    } else {
        // Нет данных
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colSpanTotal + 1;
        td.className = 'no-data';
        td.innerHTML = 'Нет данных. Добавьте первую запись.';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    // Навешиваем обработчики событий
    attachTableEventHandlers(table);
    
    console.log(`✅ Данные справочника "${name}" загружены в таблицу`);
}

function formatCellValue(value, type) {
    if (value === null || value === undefined || value === '') return '';
    
    switch (type) {
        case 'date':
            return new Date(value).toLocaleDateString('ru-RU');
        case 'boolean':
            return value ? 'Да' : 'Нет';
        case 'number':
            return typeof value === 'number' ? value.toString() : value;
        default:
            return value.toString();
    }
}

function attachTableEventHandlers(table) {
    const $$ = (selector) => Array.from(table.querySelectorAll(selector));
    const on = (el, ev, handler) => el && el.addEventListener(ev, handler);
    
    // Обработчики редактирования
    $$('.btn-small.edit').forEach(btn => {
        on(btn, 'click', () => {
            const rowIndex = parseInt(btn.getAttribute('data-row'));
            showRowForm('edit', rowIndex);
        });
    });

    // Обработчики удаления
    $$('.btn-small.delete').forEach(btn => {
        on(btn, 'click', () => {
            const rowIndex = parseInt(btn.getAttribute('data-row'));
            confirmDeleteRow(rowIndex);
        });
    });
}

function confirmDeleteRow(idx) {
    if (!Number.isInteger(idx)) return;
    
    const handbookName = window.HandbookUI.getCurrentHandbook();
    const hb = window.HandbookStore.loadHandbook(handbookName);
    if (!hb) return;
    
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    hb.data.splice(idx, 1);
    window.HandbookStore.saveHandbook(handbookName, hb);
    
    window.HandbookUI.showNotification('Запись удалена', 'success');
    showHandbookData(handbookName);
}

function showRowForm(mode = 'add', idx = null) {
    const $ = (selector) => document.querySelector(selector);
    const hide = (el) => el && (el.style.display = 'none');
    const show = (el) => el && (el.style.display = 'block');

    const handbookName = window.HandbookUI.getCurrentHandbook();
    const hb = window.HandbookStore.loadHandbook(handbookName);
    if (!hb) return;

    // Скрываем таблицу, показываем форму
    const tableContainer = $('.handbook-data-table-container');
    if (tableContainer) hide(tableContainer);
    
    const cont = $('#rowFormContainer');
    show(cont);
    
    $('#rowFormTitle').textContent = mode === 'edit' ? 'Редактирование записи' : 'Добавление записи';

    const fieldsWrap = $('#rowFormFields');
    fieldsWrap.innerHTML = '';

    const row = (mode === 'edit' && Number.isInteger(idx)) ? (hb.data[idx] || {}) : {};

    // Создаем поля формы на основе структуры справочника
    hb.fields.forEach(f => {
        if (f.type === 'group') {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'grouped-field';
            groupDiv.innerHTML = `
                <div class="grouped-field-header">
                    <h4>${f.name}</h4>
                </div>
            `;
            const subWrap = document.createElement('div');
            subWrap.className = 'sub-fields-container';

            (f.fields || []).forEach(sf => {
                const val = row?.[f.name]?.[sf.name] ?? '';
                const label = sf.unit ? `${sf.name} (${sf.unit})` : sf.name;

                if (sf.type === 'reference') {
                    const safeGroup = f.name.replace(/\s+/g, '_');
                    const safeSub   = sf.name.replace(/\s+/g, '_');
                    const selectId  = `reference_${safeGroup}_${safeSub}`;
                    
                    const refDiv = document.createElement('div');
                    refDiv.className = 'reference-subfield-group';
                    refDiv.innerHTML = `
                        <div class="form-group sub-field-group">
                            <label class="form-label">${label}:</label>
                            <select class="form-input" name="${f.name}.${sf.name}" id="${selectId}">
                                <option value="">-- Выберите значение --</option>
                            </select>
                        </div>
                    `;
                    subWrap.appendChild(refDiv);
                    
                    // Загружаем список вариантов
                    if (sf.reference) {
                        setTimeout(() => {
                            const opts = window.FieldBuilder.getReferenceOptions(sf.reference.handbook, sf.reference.field);
                            const el = document.getElementById(selectId);
                            
                            if (el) {
                                el.innerHTML = '<option value="">-- Выберите значение --</option>';
                                opts.forEach(opt => {
                                    const optEl = document.createElement('option');
                                    optEl.value = opt;
                                    optEl.textContent = opt;
                                    if (opt === val) optEl.selected = true;
                                    el.appendChild(optEl);
                                });
                            }
                        }, 100);
                    }
                } else {
                    subWrap.insertAdjacentHTML('beforeend', `
                        <div class="form-group sub-field-group">
                            <label class="form-label">${label}:</label>
                            ${inputFor(`${f.name}.${sf.name}`, sf.type, val)}
                        </div>
                    `);
                }
            });

            groupDiv.appendChild(subWrap);
            fieldsWrap.appendChild(groupDiv);
        } else if (f.type === 'reference') {
            const val   = row?.[f.name] ?? '';
            const label = f.unit ? `${f.name} (${f.unit})` : f.name;
            const safeId = `reference_${f.name.replace(/\s+/g, '_')}`;
            
            const refDiv = document.createElement('div');
            refDiv.className = 'reference-field-group';
            refDiv.innerHTML = `
                <div class="form-group">
                    <label class="form-label">${label}:</label>
                    <select class="form-input" name="${f.name}" id="${safeId}">
                        <option value="">-- Выберите значение --</option>
                    </select>
                </div>
            `;
            fieldsWrap.appendChild(refDiv);
            
            // Загружаем варианты
            if (f.reference) {
                setTimeout(() => {
                    const opts = window.FieldBuilder.getReferenceOptions(f.reference.handbook, f.reference.field);
                    const sel  = document.getElementById(safeId);
                    
                    if (sel) {
                        sel.innerHTML = '<option value="">-- Выберите значение --</option>';
                        opts.forEach(opt => {
                            const o = document.createElement('option');
                            o.value = opt;
                            o.textContent = opt;
                            if (opt === val) o.selected = true;
                            sel.appendChild(o);
                        });
                    }
                }, 100);
            }
        } else {
            const val = row?.[f.name] ?? '';
            const label = f.unit ? `${f.name} (${f.unit})` : f.name;
            fieldsWrap.insertAdjacentHTML('beforeend', `
                <div class="form-group">
                    <label class="form-label">${label}:</label>
                    ${inputFor(f.name, f.type, val)}
                </div>
            `);
        }
    });

    // Обработчик отправки формы
    const form = $('#rowForm');
    if (form) {
        // Удаляем старые обработчики
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', (ev) => {
            ev.preventDefault();
            handleRowSubmit(ev, mode, idx);
        });
    }

    // Обработчик кнопки отмены - ИСПРАВЛЕНИЕ!
    const cancelBtn = $('#cancelRowFormBtn');
    if (cancelBtn) {
        // Удаляем старые обработчики и добавляем новый
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.addEventListener('click', () => {
            hide($('#rowFormContainer'));
            show($('.handbook-data-table-container'));
        });
    }
}

function inputFor(name, type, val = '') {
    switch (type) {
        case 'boolean':
            return `
                <select class="form-input" name="${name}">
                    <option value="">-- Не выбрано --</option>
                    <option value="true" ${val === true || val === 'true' ? 'selected' : ''}>Да</option>
                    <option value="false" ${val === false || val === 'false' ? 'selected' : ''}>Нет</option>
                </select>
            `;
        case 'date':
            const dateValue = val ? new Date(val).toISOString().split('T')[0] : '';
            return `<input type="date" class="form-input" name="${name}" value="${dateValue}">`;
        case 'number':
            return `<input type="number" class="form-input" name="${name}" value="${val}" step="any">`;
        default:
            return `<input type="text" class="form-input" name="${name}" value="${val}">`;
    }
}

function handleRowSubmit(e, mode, idx) {
    const handbookName = window.HandbookUI.getCurrentHandbook();
    const hb = window.HandbookStore.loadHandbook(handbookName);
    if (!hb) return;
    
    const form = e.target;
    const fd = new FormData(form);
    const obj = Object.fromEntries(fd.entries());
    const newRow = {};
    
    console.log('📝 Обработка данных формы:', obj);
    
    // Преобразуем данные формы в структуру справочника
    hb.fields.forEach(f => {
        if (f.type === 'group') {
            newRow[f.name] = {};
            (f.fields || []).forEach(sf => {
                const key = `${f.name}.${sf.name}`;
                let v = obj[key];
                
                // Преобразуем типы данных
                if (sf.type === 'number' && v !== '') v = Number(v);
                if (sf.type === 'boolean') v = v === 'true';
                
                newRow[f.name][sf.name] = v !== undefined ? v : '';
            });
        } else {
            let v = obj[f.name];
            
            // Преобразуем типы данных
            if (f.type === 'number' && v !== '') v = Number(v);
            if (f.type === 'boolean') v = v === 'true';
            
            newRow[f.name] = v !== undefined ? v : '';
        }
    });

    console.log('💾 Сохранение записи:', newRow);

    // Сохраняем данные
    if (mode === 'edit' && Number.isInteger(idx)) {
        hb.data[idx] = newRow;
        window.HandbookUI.showNotification('Запись обновлена', 'success');
    } else {
        hb.data.push(newRow);
        window.HandbookUI.showNotification('Запись добавлена', 'success');
    }

    // Сохраняем справочник
    window.HandbookStore.saveHandbook(handbookName, hb);
    
    // Закрываем форму и показываем таблицу
    const $ = (selector) => document.querySelector(selector);
    const hide = (el) => el && (el.style.display = 'none');
    const show = (el) => el && (el.style.display = 'block');
    
    hide($('#rowFormContainer'));
    show($('.handbook-data-table-container'));
    
    // Обновляем таблицу
    showHandbookData(handbookName);
}

function initDataTableHandlers() {
    const $ = (selector) => document.querySelector(selector);
    
    // Кнопка добавления записи
    const addRowBtn = $('#addRowBtn');
    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => showRowForm('add'));
    }
    
    // Кнопка возврата к списку
    const backToListBtn = $('#backToListBtn');
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            window.HandbookUI.showHandbookList();
        });
    }
    
    // Кнопка экспорта данных
    const exportDataBtn = $('#exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            const handbookName = window.HandbookUI.getCurrentHandbook();
            const hb = window.HandbookStore.loadHandbook(handbookName);
            if (!hb) return;
            
            const dataStr = JSON.stringify(hb.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${handbookName}_data.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            window.HandbookUI.showNotification('Данные экспортированы', 'success');
        });
    }
    
    console.log('✅ Обработчики DataTable инициализированы');
}

window.DataTable = {
    showHandbookData,
    confirmDeleteRow,
    showRowForm,
    handleRowSubmit,
    initDataTableHandlers,
    formatCellValue,
    inputFor,
    attachTableEventHandlers
};

console.log('✅ DataTable загружен');