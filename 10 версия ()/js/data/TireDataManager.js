// TireDataManager.js
// Центральный менеджер данных шин, самосвалов, складов, состояний.
// Загрузка всех JSON через fetch. FSAPI не используется.

class TireDataManager {
    constructor() {
      this.tiresData = { tires: [] };
      this.trucksData = { trucks: [] };
      this.warehouses = [];
      this.states = [];
  
      this.currentPositions = { lastUpdate: null, trucks: [], tires: [] };
      this.movementsHistory = [];
  
      // Порядок позиций в самосвале
      this.POSITIONS = ['ПП','ПЛ','ЗЛН','ЗЛВ','ЗПВ','ЗПН'];
  
      this._initialized = false;
    }
  
    // Инициализация
    async initialize() {
      if (this._initialized) return;
      try {
        await this.loadCatalogs();
        await this.loadCurrentPositions();
        await this.loadMovementsHistory();
        this._initialized = true;
        console.log('TireDataManager initialized');
      } catch (e) {
        console.error('TireDataManager.initialize error', e);
      }
    }
  
    // Универсальная функция fetch JSON
    async fetchJsonCandidates(candidates = []) {
      for (const path of candidates) {
        try {
          const resp = await fetch(path, { cache: 'no-store' });
          if (resp.ok) {
            const json = await resp.json();
            return json;
          }
        } catch (e) {
          console.warn(`fetch failed for ${path}`, e);
        }
      }
      throw new Error('No candidate file found: ' + candidates.join(','));
    }
  
    // Загрузка всех справочников
    async loadCatalogs() {
      // Tires
      try {
        const t = await this.fetchJsonCandidates([
          'json/Tires.json',
          'json/Tires_data.json',
          'json/tires.json'
        ]);
        this.tiresData = Array.isArray(t) ? { tires: t } : (t || { tires: [] });
        if (!Array.isArray(this.tiresData.tires)) this.tiresData.tires = [];
        console.log('TireDataManager: Tires loaded', this.tiresData.tires.length);
      } catch (e) {
        console.warn('TireDataManager: Tires load failed', e);
        this.tiresData = { tires: [] };
      }
  
      // Trucks
      try {
        const tr = await this.fetchJsonCandidates([
          'json/Trucks.json',
          'json/trucks-data.json',
          'json/trucks.json'
        ]);
        this.trucksData = Array.isArray(tr) ? { trucks: tr } : (tr || { trucks: [] });
        if (!Array.isArray(this.trucksData.trucks)) this.trucksData.trucks = [];
        console.log('TireDataManager: Trucks loaded', this.trucksData.trucks.length);
      } catch (e) {
        console.warn('TireDataManager: Trucks load failed', e);
        this.trucksData = { trucks: [] };
      }
  
      // Warehouses
      try {
        const w = await this.fetchJsonCandidates([
          'json/Warehouses.json',
          'json/warehouses-data.json',
          'json/Warehouse_data.json'
        ]);
        if (Array.isArray(w)) this.warehouses = w;
        else if (w && Array.isArray(w.warehouses)) this.warehouses = w.warehouses;
        else if (w && Array.isArray(w.data)) this.warehouses = w.data;
        else this.warehouses = [];
        console.log('TireDataManager: Warehouses loaded', this.warehouses.length);
      } catch (e) {
        console.warn('TireDataManager: Warehouses load failed', e);
        this.warehouses = [{ id: 'wh-default', name: 'Не распределенные' }];
      }
  
      // States
      try {
        const s = await this.fetchJsonCandidates([
          'json/States.json',
          'json/Состояния_data.json'
        ]);
        if (Array.isArray(s)) this.states = s;
        else if (s && Array.isArray(s.states)) this.states = s.states;
        else if (s && Array.isArray(s.data)) this.states = s.data;
        else this.states = [];
        console.log('TireDataManager: States loaded', this.states.length);
      } catch (e) {
        console.warn('TireDataManager: States load failed', e);
        this.states = [
          { id: 'new', name: 'Новое' },
          { id: 'used', name: 'Б/У' },
          { id: 'repair', name: 'Ремонт' },
          { id: 'scrap', name: 'Списание' }
        ];
      }
    }
  
    // Текущие позиции шин
    async loadCurrentPositions() {
      try {
        const r = await fetch('json/tire-positions-current.json', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          this.currentPositions = j || { lastUpdate: null, trucks: [], tires: [] };
          this._ensurePositionsStructure();
          return;
        }
      } catch (e) {
        console.warn('TireDataManager: current positions fetch failed', e);
      }
      this.currentPositions = { lastUpdate: null, trucks: [], tires: [] };
      this._ensurePositionsStructure();
    }
  
    _ensurePositionsStructure() {
      if (!Array.isArray(this.currentPositions.trucks)) this.currentPositions.trucks = [];
      if (!Array.isArray(this.currentPositions.tires)) this.currentPositions.tires = [];
    }
  
    // История перемещений
    async loadMovementsHistory() {
      try {
        const r = await fetch('json/tire-movements-history.json', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          this.movementsHistory = Array.isArray(j.movements) ? j.movements : [];
          return;
        }
      } catch (e) { console.warn('TireDataManager: movements fetch failed', e); }
      this.movementsHistory = [];
    }
  
    async saveCurrentPositions() {
      try { localStorage.setItem('tire-positions-current.json', JSON.stringify(this.currentPositions)); } 
      catch (e) { console.error('TireDataManager: save positions failed', e); }
    }
  
    async saveMovementsHistory() {
      const payload = { movements: this.movementsHistory || [] };
      try { localStorage.setItem('tire-movements-history.json', JSON.stringify(payload)); } 
      catch (e) { console.error('TireDataManager: save movements failed', e); }
    }
  
    // Получить список самосвалов
    getTrucksList() {
      const arr = (this.trucksData && Array.isArray(this.trucksData.trucks)) ? this.trucksData.trucks : [];
      return arr.map(t => ({
        id: t.id || t.truckId || null,
        number: t.number || t.name || '',
        model: t.model || '',
        tires: t.tires || []
      }));
    }
  
    // Получить позиции шин для конкретного самосвала (6 позиций)
    getTiresForTruck(truckId) {
      const result = [];
      const truckEntry = (Array.isArray(this.currentPositions.trucks))
        ? this.currentPositions.trucks.find(t => String(t.id) === String(truckId) || String(t.truckId) === String(truckId))
        : null;
  
      const tiresMap = truckEntry ? (truckEntry.tires || truckEntry.positions || {}) : {};
  
      const findTire = tid => {
        if (!tid) return null;
        const arr = Array.isArray(this.currentPositions.tires) ? this.currentPositions.tires : [];
        return arr.find(x => String(x.tireId || x.id) === String(tid)) || null;
      };
  
      for (const pos of this.POSITIONS) {
        let tid = null;
        if (Array.isArray(tiresMap)) {
          const item = tiresMap.find(it => it && (it.position === pos || it.pos === pos));
          tid = item ? (item.tireId || item.id) : null;
        } else if (tiresMap && typeof tiresMap === 'object') {
          tid = tiresMap[pos] || tiresMap[pos.toString()] || null;
        }
  
        if (!tid) { result.push({ position: pos, isEmpty: true }); continue; }
        const tire = findTire(tid);
        if (!tire) { result.push({ position: pos, isEmpty: true }); continue; }
  
        result.push({ position: pos, isEmpty: false, id: tire.tireId || tire.id || null, data: tire });
      }
  
      return result;
    }
  }
  
  // Глобальный экземпляр
  window.tireDataManager = window.tireDataManager || new TireDataManager();
  