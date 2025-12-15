// warehouse-integration.js
// Load warehouses via fetch and push into tireDataManager

(async function() {
    try {
      let data = null;
      try {
        const resp = await fetch('json/Warehouses.json', { cache: 'no-store' });
        if (resp.ok) data = await resp.json();
        else console.warn('warehouse-integration: fetch returned', resp.status);
      } catch (e) {
        console.warn('warehouse-integration: fetch failed', e);
      }
  
      // FSAPI fallback if fetch returned nothing
      if ((!data || Object.keys(data).length === 0) && window.FSAPI && typeof window.FSAPI.readJsonFile === 'function') {
        try {
          data = await window.FSAPI.readJsonFile('Warehouses.json');
        } catch (e) {
          // ignore
        }
      }
  
      // Normalize
      let warehouses = [];
      if (Array.isArray(data)) warehouses = data;
      else if (data && Array.isArray(data.warehouses)) warehouses = data.warehouses;
      else if (data && Array.isArray(data.data)) warehouses = data.data;
  
      // Put into manager
      if (window.tireDataManager) {
        window.tireDataManager.warehouses = warehouses;
      }
  
      // Update UI selects if present
      const sel = document.getElementById('warehouseSelect');
      if (sel) {
        sel.innerHTML = warehouses.length ? warehouses.map(w => `<option value="${w.id}">${w.name||w.Наименование||w.id}</option>`).join('') : '<option value="">Нет складов</option>';
      }
      console.log('warehouse-integration loaded', warehouses.length);
    } catch (e) {
      console.error('warehouse-integration error', e);
    }
  })();
  