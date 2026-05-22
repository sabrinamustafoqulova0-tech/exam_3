import { configureStore } from "@reduxjs/toolkit";
import { searchApi } from "../services/Search";
import { profileApi } from "../services/Profile";

    
    // Здесь также могут быть твои обычные слайсы, например:
    // home: homeReducer,
import { storyApi } from "../services/home.store";
import { postApi } from "../services/publication.home";
import { authApi } from "../services/authApi"
import { reelsApi } from "../services/Reels"
import notificationReducer from "./notificationSlice"


export const store = configureStore({
  reducer: {
    // Добавляем редюсеры
    [authApi.reducerPath]: authApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [storyApi.reducerPath]: storyApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
    [reelsApi.reducerPath]: reelsApi.reducer,
    notifications: notificationReducer,
    // Здесь также могут быть твои обычные слайсы, например:
    // home: homeReducer,
  },
  // Добавляем МИДЛВАРЫ для каждого API (каждый middleware только один раз)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      searchApi.middleware,
      profileApi.middleware,
      storyApi.middleware,
      postApi.middleware,
      reelsApi.middleware
    ),
});

// Типы для TypeScript (если используешь)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
