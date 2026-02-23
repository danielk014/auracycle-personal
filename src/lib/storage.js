function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function storageKey(userId, entityName) {
  return `auracycle_${entityName}_${userId}`;
}

function readItems(userId, entityName) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId, entityName)) || '[]');
  } catch { return []; }
}

function writeItems(userId, entityName, items) {
  localStorage.setItem(storageKey(userId, entityName), JSON.stringify(items));
}

function makeCollection(userId, name) {
  return {
    async list(orderField = '-date', limit = 200) {
      let items = readItems(userId, name);
      const desc  = orderField.startsWith('-');
      const field = orderField.replace(/^-/, '');
      items.sort((a, b) => {
        if (a[field] < b[field]) return desc ? 1 : -1;
        if (a[field] > b[field]) return desc ? -1 : 1;
        return 0;
      });
      return items.slice(0, limit);
    },

    async create(data) {
      const items = readItems(userId, name);
      const item  = { ...data, id: generateId(), created_at: new Date().toISOString() };
      items.push(item);
      writeItems(userId, name, items);
      return item;
    },

    async update(id, data) {
      const items = readItems(userId, name);
      const idx   = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error(`${name}: item not found`);
      items[idx] = { ...items[idx], ...data };
      writeItems(userId, name, items);
      return items[idx];
    },

    async delete(id) {
      const items = readItems(userId, name);
      writeItems(userId, name, items.filter(i => i.id !== id));
    },
  };
}

export function createEntityStore(userId) {
  return {
    CycleLog:      makeCollection(userId, 'CycleLog'),
    CycleSettings: makeCollection(userId, 'CycleSettings'),
  };
}
