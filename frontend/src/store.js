import { configureStore, createSlice } from '@reduxjs/toolkit'

// --- AUTH SLICE ---
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    user: null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null
  },
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    authFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    }
  }
})

// --- INVENTORY SLICE ---
const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    categories: [],
    suppliers: [],
    loading: false,
    error: null
  },
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchItemsSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload;
    },
    fetchCategoriesSuccess: (state, action) => {
      state.categories = action.payload;
    },
    fetchSuppliersSuccess: (state, action) => {
      state.suppliers = action.payload;
    },
    addItemSuccess: (state, action) => {
      state.items.push(action.payload);
    },
    updateBatchSuccess: (state, action) => {
      const updatedBatch = action.payload;
      const itemIndex = state.items.findIndex(i => i.id === updatedBatch.inventory_item_id);
      if (itemIndex !== -1) {
        const batchIndex = state.items[itemIndex].batches.findIndex(b => b.id === updatedBatch.id);
        if (batchIndex !== -1) {
          state.items[itemIndex].batches[batchIndex] = updatedBatch;
        }
      }
    },
    addBatchSuccess: (state, action) => {
      const newBatch = action.payload;
      const itemIndex = state.items.findIndex(i => i.id === newBatch.inventory_item_id);
      if (itemIndex !== -1) {
        state.items[itemIndex].batches.push(newBatch);
      }
    },
    deleteItemSuccess: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    actionFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
})

// --- ALERTS SLICE ---
const alertsSlice = createSlice({
  name: 'alerts',
  initialState: {
    notifications: [],
    unreadCount: 0
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.is_read).length;
    },
    markReadSuccess: (state, action) => {
      const id = action.payload;
      const idx = state.notifications.findIndex(n => n.id === id);
      if (idx !== -1) {
        state.notifications[idx].is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    }
  }
})

// Export Action Creators
export const { authStart, authSuccess, authFailed, setUser, logout } = authSlice.actions
export const {
  fetchStart,
  fetchItemsSuccess,
  fetchCategoriesSuccess,
  fetchSuppliersSuccess,
  addItemSuccess,
  updateBatchSuccess,
  addBatchSuccess,
  deleteItemSuccess,
  actionFailed
} = inventorySlice.actions
export const { setNotifications, markReadSuccess } = alertsSlice.actions

// Configure Global Store
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    inventory: inventorySlice.reducer,
    alerts: alertsSlice.reducer
  }
})
export default store
