import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../services/authApi"; 
import { searchApi } from "../services/Search";
import { profileApi } from "../services/Profile";

export const store = configureStore({
  reducer: {
    // Добавляем редюсеры
    [authApi.reducerPath]: authApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    
    // Здесь также могут быть твои обычные слайсы, например:
    // home: homeReducer,
  },
  // Добавляем МИДЛВАРЫ для каждого API (это исправит ошибку)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      searchApi.middleware,
      profileApi.middleware
    ),
});

// Типы для TypeScript (если используешь)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;