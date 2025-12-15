// TireDnDModal.js
// Minimal safe modal that uses tireDataManager for states and warehouses.
// Does NOT directly fetch files.

class TireDnDModal {
    constructor() {
      this.modal = null;
      this.onSubmit = null;
    }
  
    async open(params = {}) {
      try {
        if (window.tireDataManager && typeof window.tireDataManager.initialize === 'function') {
          if (!window.tireDataManager._initialized) await window.tireDataManager.initialize();
        }
  
        const states = (window.tireDataManager && window.tireDataManager.states) || [];
        const warehouses = (window.tireDataManager && window.tireDataManager.warehouses) || [];
  
        // build selects
        const stateOptions = states.length ? states.map(s => `<option value="${s.id}">${s.name||s.Наименование||s.id}</option>`).join('') : `<option value="">Нет состояний</option>`;
        const whOptions = warehouses.length ? warehouses.map(w => `<option value="${w.id}">${w.name||w.Наименование||w.id}</option>`).join('') : `<option value="">Нет складов</option>`;
  
        this.modal = document.createElement('div');
        this.modal.className = 'tire-dnd-modal-overlay';
        this.modal.innerHTML = `
          <div class="tire-dnd-modal">
            <div class="modal-header"><h3>${params.isReplacement ? 'ЗАМЕНА' : 'ПЕРЕМЕЩЕНИЕ'}</h3><button class="close">&times;</button></div>
            <div class="modal-body">
              <p>Шина: ${(params.tire && (params.tire.serial || params.tire.tireId || params.tire.id)) || '—'}</p>
              <label>Состояние</label>
              <select class="state-select">${stateOptions}</select>
              <label>Склад</label>
              <select class="warehouse-select">${whOptions}</select>
              <label>Причина</label>
              <textarea class="reason-input" rows="3"></textarea>
            </div>
            <div class="modal-footer">
              <button class="ok">OK</button>
              <button class="cancel">Отмена</button>
            </div>
          </div>
        `;
        document.body.appendChild(this.modal);
  
        // handlers
        this.modal.querySelector('.close').onclick = () => this.close();
        this.modal.querySelector('.cancel').onclick = () => this.close();
        this.modal.querySelector('.ok').onclick = () => {
          const state = this.modal.querySelector('.state-select').value;
          const warehouse = this.modal.querySelector('.warehouse-select').value;
          const reason = this.modal.querySelector('.reason-input').value;
          const payload = { state, warehouse, reason, params };
          if (typeof this.onSubmit === 'function') this.onSubmit(payload);
          this.close();
        };
      } catch (e) {
        console.error('TireDnDModal.open error', e);
        alert('Ошибка при открытии окна DnD: ' + (e.message || e));
      }
    }
  
    close() {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
        this.modal = null;
      }
    }
  
    setSubmitHandler(fn) {
      this.onSubmit = fn;
    }
  }
  
  window.TireDnDModal = window.TireDnDModal || TireDnDModal;
  