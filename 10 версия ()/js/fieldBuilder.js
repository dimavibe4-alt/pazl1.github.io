// js/fieldBuilder.js
/* fieldBuilder.js - Конструктор полей справочников */

let _fieldId = 0;
let _subId = 0;

function resetFieldCounters() {
    _fieldId = 0;
    _subId = 0;
    console.log('🔄 Счетчики полей сброшены');
}

function addFieldDefinition(presetType) {
    _fieldId += 1;
    const id = _fieldId;

    const html = `
        <div class="field-definition" data-field-id="${id}">
            <div class="field-header">
                <h4>Поле ${id}</h4>
                <button type="button" class="remove-field" data-remove-field="${id}">
                    <i class="fas fa-times"></i> Удалить
                </button>
            </div>

            <div class="form-group">
                <label class="form-label">Название поля:</label>
                <input type="text" class="form-input" name="field_name_${id}" required 
                       placeholder="Введите название поля">
            </div>

            <div class="form-group">
                <label class="form-label">Тип поля:</label>
                <select class="form-input field-type-select" name="field_type_${id}">
                    <option value="string">Текст</option>
                    <option value="number">Число</option>
                    <option value="date">Дата</option>
                    <option value="boolean">Да/Нет</option>
                    <option value="group">Группа полей</option>
                    <option value="reference">Ссылка на справочник</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Единица измерения:</label>
                <input type="text" class="form-input" name="field_unit_${id}" 
                       placeholder="Например: кг, шт, м">
                <div class="form-help">Оставьте пустым, если единица измерения не нужна</div>
            </div>

            <div class="subfields-container" id="subfields_${id}" style="display:none">
                <div class="subfields-header">
                    <h5>Подполя группы:</h5>
                    <div class="form-help">Добавьте подполя, которые будут входить в эту группу</div>
                </div>
                <div class="subfields-list" id="subfields_list_${id}"></div>
                <div class="subfields-footer">
                    <button type="button" class="btn" data-add-sub="${id}">
                        <i class="fas fa-plus"></i> Добавить подполе
                    </button>
                </div>
            </div>

            <div class="reference-settings" id="reference_settings_${id}" style="display:none">
                <div class="form-group">
                    <label class="form-label">Справочник:</label>
                    <select class="form-input" name="reference_handbook_${id}" 
                            onchange="window.FieldBuilder.updateReferenceFields(${id})">
                        <option value="">-- Выберите справочник --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Поле для отображения:</label>
                    <select class="form-input" name="reference_field_${id}">
                        <option value="">-- Сначала выберите справочник --</option>
                    </select>
                </div>
                <div class="form-help">
                    Это поле будет показывать выпадающий список с значениями из выбранного справочника
                </div>
            </div>
        </div>
    `;
    
    AppUtils.$('#fieldDefinitions').insertAdjacentHTML('beforeend', html);

    const typeSel = AppUtils.$(`[name="field_type_${id}"]`);
    AppUtils.on(typeSel, 'change', () => toggleFieldType(id));
    
    updateReferenceHandbooksList(id);
    
    if (presetType) {
        typeSel.value = presetType;
        toggleFieldType(id, true);
    }

    AppUtils.on(AppUtils.$(`[data-remove-field="${id}"]`), 'click', () => {
        const box = AppUtils.$(`[data-field-id="${id}"]`);
        if (box) {
            box.style.opacity = '0';
            setTimeout(() => {
                if (box.parentNode) {
                    box.parentNode.removeChild(box);
                }
            }, 300);
        }
    });

    AppUtils.on(AppUtils.$(`[data-add-sub="${id}"]`), 'click', () => addSubField(id));

    console.log(`✅ Добавлено поле #${id}`);
    return id;
}

function toggleFieldType(fieldId, ensureAtLeastOneSub = false) {
    const t = AppUtils.$(`[name="field_type_${fieldId}"]`)?.value;
    const cont = AppUtils.$('#subfields_'+fieldId);
    const refCont = AppUtils.$('#reference_settings_'+fieldId);
    
    if (!cont || !refCont) return;
    
    cont.style.display = 'none';
    refCont.style.display = 'none';
    
    if (t === 'group') {
        cont.style.display = 'block';
        const existing = AppUtils.$$(`[data-parent="${fieldId}"]`).length;
        if (ensureAtLeastOneSub && existing === 0) addSubField(fieldId);
    } else if (t === 'reference') {
        refCont.style.display = 'block';
    }
    
    console.log(`🔄 Тип поля #${fieldId} изменен на: ${t}`);
}

function addSubField(parentFieldId) {
    _subId += 1;
    const sid = _subId;
    const html = `
        <div class="subfield-definition" data-subfield-id="${sid}" data-parent="${parentFieldId}">
            <div class="subfield-header">
                <h6>Подполе ${sid}</h6>
                <button type="button" class="remove-subfield" data-remove-sub="${sid}">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="form-group">
                <label class="form-label">Название подполя:</label>
                <input type="text" class="form-input" name="subfield_name_${parentFieldId}_${sid}" 
                       placeholder="Введите название подполя">
            </div>

            <div class="form-group">
                <label class="form-label">Тип данных:</label>
                <select class="form-input subfield-type-select" name="subfield_type_${parentFieldId}_${sid}">
                    <option value="string">Текст</option>
                    <option value="number">Число</option>
                    <option value="date">Дата</option>
                    <option value="boolean">Да/Нет</option>
                    <option value="reference">Ссылка на справочник</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Единица измерения:</label>
                <input type="text" class="form-input" name="subfield_unit_${parentFieldId}_${sid}" 
                       placeholder="Например: т">
            </div>

            <div class="reference-settings subfield-reference" id="subfield_reference_${parentFieldId}_${sid}" style="display:none">
                <div class="form-group">
                    <label class="form-label">Справочник:</label>
                    <select class="form-input" name="subfield_reference_handbook_${parentFieldId}_${sid}" 
                            onchange="window.FieldBuilder.updateSubfieldReferenceFields(${parentFieldId}, ${sid})">
                        <option value="">-- Выберите справочник --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Поле для отображения:</label>
                    <select class="form-input" name="subfield_reference_field_${parentFieldId}_${sid}">
                        <option value="">-- Сначала выберите справочник --</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    AppUtils.$('#subfields_list_'+parentFieldId).insertAdjacentHTML('beforeend', html);

    // Обработчик изменения типа подполя
    const typeSel = AppUtils.$(`[name="subfield_type_${parentFieldId}_${sid}"]`);
    AppUtils.on(typeSel, 'change', () => toggleSubfieldType(parentFieldId, sid));
    
    // Инициализация списка справочников для подполя
    updateSubfieldReferenceHandbooksList(parentFieldId, sid);
    
    AppUtils.on(AppUtils.$(`[data-remove-sub="${sid}"]`), 'click', () => {
        const box = AppUtils.$(`[data-subfield-id="${sid}"]`);
        if (box) {
            box.style.opacity = '0';
            setTimeout(() => {
                if (box.parentNode) {
                    box.parentNode.removeChild(box);
                }
            }, 300);
        }
    });
    
    console.log(`✅ Добавлено подполе #${sid} к полю #${parentFieldId}`);
    return sid;
}

function toggleSubfieldType(parentFieldId, subfieldId) {
    const t = AppUtils.$(`[name="subfield_type_${parentFieldId}_${subfieldId}"]`)?.value;
    const refCont = AppUtils.$(`#subfield_reference_${parentFieldId}_${subfieldId}`);
    
    if (!refCont) return;
    
    if (t === 'reference') {
        refCont.style.display = 'block';
    } else {
        refCont.style.display = 'none';
    }
    
    console.log(`🔄 Тип подполя #${subfieldId} изменен на: ${t}`);
}

function updateSubfieldReferenceHandbooksList(parentFieldId, subfieldId) {
    const select = AppUtils.$(`[name="subfield_reference_handbook_${parentFieldId}_${subfieldId}"]`);
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Выберите справочник --</option>';
    
    // Получаем актуальный список справочников, включая отложенные изменения
    const allHandbooks = { ...window.HandbookStore.getAllHandbooks() };
    if (window.PendingChanges && window.PendingChanges.pendingChanges && window.PendingChanges.pendingChanges.handbooks) {
        Object.entries(window.PendingChanges.pendingChanges.handbooks).forEach(([name, data]) => {
            if (data._deleted) {
                delete allHandbooks[name];
            } else {
                allHandbooks[name] = data;
            }
        });
    }
    
    Object.keys(allHandbooks).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function updateSubfieldReferenceFields(parentFieldId, subfieldId) {
    const handbookSelect = AppUtils.$(`[name="subfield_reference_handbook_${parentFieldId}_${subfieldId}"]`);
    const fieldSelect = AppUtils.$(`[name="subfield_reference_field_${parentFieldId}_${subfieldId}"]`);
    
    if (!handbookSelect || !fieldSelect) return;
    
    const handbookName = handbookSelect.value;
    if (!handbookName) {
        fieldSelect.innerHTML = '<option value="">-- Сначала выберите справочник --</option>';
        return;
    }
    
    const handbook = window.HandbookStore.loadHandbook(handbookName);
    if (!handbook) {
        fieldSelect.innerHTML = '<option value="">-- Справочник не найден --</option>';
        return;
    }
    
    fieldSelect.innerHTML = '<option value="">-- Выберите поле --</option>';
    
    handbook.fields.forEach(field => {
        if (field.type === 'group') {
            (field.fields || []).forEach(subField => {
                const option = document.createElement('option');
                option.value = `${field.name}.${subField.name}`;
                option.textContent = `${field.name} → ${subField.name}`;
                fieldSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = field.name;
            option.textContent = field.name;
            fieldSelect.appendChild(option);
        }
    });
    
    console.log(`🔄 Обновлены поля для подполя #${subfieldId}`);
}

function updateReferenceHandbooksList(fieldId) {
    const select = AppUtils.$(`[name="reference_handbook_${fieldId}"]`);
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Выберите справочник --</option>';
    
    // Получаем актуальный список справочников, включая отложенные изменения
    const allHandbooks = { ...window.HandbookStore.getAllHandbooks() };
    if (window.PendingChanges && window.PendingChanges.pendingChanges && window.PendingChanges.pendingChanges.handbooks) {
        Object.entries(window.PendingChanges.pendingChanges.handbooks).forEach(([name, data]) => {
            if (data._deleted) {
                delete allHandbooks[name];
            } else {
                allHandbooks[name] = data;
            }
        });
    }
    
    Object.keys(allHandbooks).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function updateReferenceFields(fieldId) {
    const handbookSelect = AppUtils.$(`[name="reference_handbook_${fieldId}"]`);
    const fieldSelect = AppUtils.$(`[name="reference_field_${fieldId}"]`);
    
    if (!handbookSelect || !fieldSelect) return;
    
    const handbookName = handbookSelect.value;
    if (!handbookName) {
        fieldSelect.innerHTML = '<option value="">-- Сначала выберите справочник --</option>';
        return;
    }
    
    const handbook = window.HandbookStore.loadHandbook(handbookName);
    if (!handbook) {
        fieldSelect.innerHTML = '<option value="">-- Справочник не найден --</option>';
        return;
    }
    
    fieldSelect.innerHTML = '<option value="">-- Выберите поле --</option>';
    
    handbook.fields.forEach(field => {
        if (field.type === 'group') {
            (field.fields || []).forEach(subField => {
                const option = document.createElement('option');
                option.value = `${field.name}.${subField.name}`;
                option.textContent = `${field.name} → ${subField.name}`;
                fieldSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = field.name;
            option.textContent = field.name;
            fieldSelect.appendChild(option);
        }
    });
    
    console.log(`🔄 Обновлены поля для reference поля #${fieldId}`);
}

function getReferenceOptions(handbookName, fieldPath) {
    console.log(`🔍 Поиск опций для ${handbookName}.${fieldPath}`);
    
    // Получаем актуальные данные справочника, учитывая отложенные изменения
    let handbook = null;
    
    // Сначала проверяем отложенные изменения
    if (window.PendingChanges && window.PendingChanges.pendingChanges.handbooks[handbookName]) {
        if (!window.PendingChanges.pendingChanges.handbooks[handbookName]._deleted) {
            handbook = window.PendingChanges.pendingChanges.handbooks[handbookName];
        } else {
            console.warn(`Справочник "${handbookName}" помечен как удаленный в отложенных изменениях`);
        }
    }
    
    // Если не нашли в отложенных, загружаем из хранилища
    if (!handbook) {
        handbook = window.HandbookStore.loadHandbook(handbookName);
        if (!handbook) {
            console.warn(`❌ Справочник "${handbookName}" не найден в хранилище`);
            return [];
        }
    }
    
    if (!handbook || !handbook.data) {
        console.warn(`❌ Справочник "${handbookName}" не имеет данных`);
        return [];
    }
    
    const options = new Set();
    
    handbook.data.forEach((item) => {
        let value = '';
        
        if (fieldPath.includes('.')) {
            const [groupName, fieldName] = fieldPath.split('.');
            value = item[groupName]?.[fieldName] || '';
        } else {
            value = item[fieldPath] || '';
        }
        
        if (value !== '' && value != null) {
            options.add(value.toString());
        }
    });
    
    const result = Array.from(options).sort();
    console.log(`✅ Загружено ${result.length} опций для ${handbookName}.${fieldPath}`);
    return result;
}

function handleCreateHandbook(e, editingHandbook, currentHandbook) {
    const name = AppUtils.$('#handbookName')?.value?.trim();
    if (!name) {
        alert('Введите название справочника');
        return;
    }

    // Собираем данные полей
    const fields = [];
    let hasErrors = false;

    AppUtils.$$('.field-definition').forEach(box => {
        const id = box.getAttribute('data-field-id');
        const fname = AppUtils.$(`[name="field_name_${id}"]`)?.value?.trim();
        const ftype = AppUtils.$(`[name="field_type_${id}"]`)?.value || 'string';
        const funit = AppUtils.$(`[name="field_unit_${id}"]`)?.value || '';

        if (!fname) {
            alert(`Заполните название для поля ${id}`);
            hasErrors = true;
            return;
        }

        if (ftype === 'group') {
            const sub = [];
            AppUtils.$$(`[data-parent="${id}"]`).forEach(s => {
                const sid = s.getAttribute('data-subfield-id');
                const sname = AppUtils.$(`[name="subfield_name_${id}_${sid}"]`)?.value?.trim();
                const stype = AppUtils.$(`[name="subfield_type_${id}_${sid}"]`)?.value || 'string';
                const sunit = AppUtils.$(`[name="subfield_unit_${id}_${sid}"]`)?.value || '';

                if (!sname) {
                    alert(`Заполните название для подполя ${sid} в группе "${fname}"`);
                    hasErrors = true;
                    return;
                }

                // Обработка reference подполей
                if (stype === 'reference') {
                    const referenceHandbook = AppUtils.$(`[name="subfield_reference_handbook_${id}_${sid}"]`)?.value;
                    const referenceField = AppUtils.$(`[name="subfield_reference_field_${id}_${sid}"]`)?.value;
                    
                    if (!referenceHandbook || !referenceField) {
                        alert(`Для подполя "${sname}" необходимо выбрать справочник и поле`);
                        hasErrors = true;
                        return;
                    }
                    
                    sub.push({ 
                        name: sname, 
                        type: 'reference', 
                        unit: sunit,
                        reference: {
                            handbook: referenceHandbook,
                            field: referenceField
                        }
                    });
                } else {
                    sub.push({ name: sname, type: stype, unit: sunit });
                }
            });
            
            if (!hasErrors) {
                fields.push({ name: fname, type: 'group', unit: funit, fields: sub });
            }
        } else if (ftype === 'reference') {
            const referenceHandbook = AppUtils.$(`[name="reference_handbook_${id}"]`)?.value;
            const referenceField = AppUtils.$(`[name="reference_field_${id}"]`)?.value;
            
            if (!referenceHandbook || !referenceField) {
                alert(`Для поля "${fname}" необходимо выбрать справочник и поле`);
                hasErrors = true;
                return;
            }
            
            fields.push({ 
                name: fname, 
                type: 'reference', 
                unit: funit,
                reference: {
                    handbook: referenceHandbook,
                    field: referenceField
                }
            });
        } else {
            fields.push({ name: fname, type: ftype, unit: funit });
        }
    });

    if (hasErrors) return;

    // Подготавливаем данные
    const hb = window.HandbookStore.loadHandbook(editingHandbook || name);
    const dataRows = [];

    if (editingHandbook && hb && Array.isArray(hb.data)) {
        // Миграция данных при редактировании
        hb.data.forEach(row => {
            const newRow = {};
            fields.forEach(f => {
                if (f.type === 'group') {
                    newRow[f.name] = {};
                    (f.fields||[]).forEach(sf => {
                        const oldVal = row?.[f.name]?.[sf.name];
                        newRow[f.name][sf.name] = oldVal !== undefined ? oldVal : '';
                    });
                } else {
                    newRow[f.name] = row?.[f.name] ?? '';
                }
            });
            dataRows.push(newRow);
        });
    }

    const payload = {
        name,
        fields,
        data: dataRows,
        createdAt: hb?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Если переименовали — удаляем старый ключ
    if (editingHandbook && editingHandbook !== name) {
        window.HandbookStore.deleteHandbook(editingHandbook);
    }

    // Сохраняем справочник
    window.HandbookStore.saveHandbook(name, payload);
    window.HandbookUI.setEditingHandbook(null);
    
    // Показываем уведомление
    if (editingHandbook) {
        window.HandbookUI.showNotification(`Справочник "${name}" обновлен`, 'success');
    } else {
        window.HandbookUI.showNotification(`Справочник "${name}" создан`, 'success');
    }
    
    // Возвращаемся к списку
    window.HandbookUI.showHandbookList();
    window.HandbookUI.updateHandbookMenu();
}

function showEditHandbookForm() {
    const name = window.HandbookUI.getCurrentHandbook() || prompt('Введите название редактируемого справочника:');
    if (!name) return;
    
    window.HandbookUI.showEditHandbookForm(name);
}

function initFieldBuilder() {
    console.log('🔧 Инициализация FieldBuilder...');
    
    // Обработчик кнопки добавления поля
    const addFieldBtn = AppUtils.$('#addFieldBtn');
    if (addFieldBtn) {
        AppUtils.on(addFieldBtn, 'click', () => {
            addFieldDefinition();
        });
    }
    
    console.log('✅ FieldBuilder инициализирован');
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFieldBuilder);
} else {
    initFieldBuilder();
}

window.FieldBuilder = {
    resetFieldCounters,
    addFieldDefinition,
    toggleFieldType,
    addSubField,
    updateReferenceHandbooksList,
    updateReferenceFields,
    getReferenceOptions,
    handleCreateHandbook,
    showEditHandbookForm,
    
    // Функции для подполей
    toggleSubfieldType,
    updateSubfieldReferenceHandbooksList,
    updateSubfieldReferenceFields
};

console.log('✅ FieldBuilder загружен');