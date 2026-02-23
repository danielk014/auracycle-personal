/**
 * base44Client.js — compatibility shim
 * Replaces the Base44 SDK with localStorage-backed storage per user.
 * All pages import { base44 } from here and the API shape is identical.
 */
import { getCurrentUser, logout } from '@/lib/userAuth';
import { createEntityStore }      from '@/lib/storage';

function getStore() {
  const user = getCurrentUser();
  if (!user) return null;
  return createEntityStore(user.id);
}

function makeProxy(entityName) {
  return {
    async list(...args) {
      const store = getStore();
      if (!store) return [];
      return store[entityName].list(...args);
    },
    async create(data) {
      const store = getStore();
      if (!store) throw new Error('Not authenticated');
      return store[entityName].create(data);
    },
    async update(id, data) {
      const store = getStore();
      if (!store) throw new Error('Not authenticated');
      return store[entityName].update(id, data);
    },
    async delete(id) {
      const store = getStore();
      if (!store) throw new Error('Not authenticated');
      return store[entityName].delete(id);
    },
  };
}

export const base44 = {
  entities: {
    CycleLog:      makeProxy('CycleLog'),
    CycleSettings: makeProxy('CycleSettings'),
  },
  auth: {
    logout() {
      logout();
      window.location.href = '/Login';
    },
  },
};
