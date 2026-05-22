import { configureStore } from "@reduxjs/toolkit";
<<<<<<< HEAD
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
=======
import { storyApi } from "../services/home.store";
import { postApi } from "../services/publication.home";
import { authApi } from "../services/authApi"
import { reelsApi } from "../services/Reels"
import notificationReducer from "./notificationSlice"


export const store = configureStore({
  reducer: {
    [storyApi.reducerPath]: storyApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
        [authApi.reducerPath]: authApi.reducer,
    [reelsApi.reducerPath]: reelsApi.reducer,
    notifications: notificationReducer,
>>>>>>> d7940752846932116b3599ce055539de74766e95
  },
  // Добавляем МИДЛВАРЫ для каждого API (это исправит ошибку)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
<<<<<<< HEAD
      authApi.middleware,
      searchApi.middleware,
      profileApi.middleware
    ),
});

// Типы для TypeScript (если используешь)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
=======
      storyApi.middleware,
      postApi.middleware
    ) .concat(authApi.middleware)
      .concat(reelsApi.middleware),
});
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
>>>>>>> d7940752846932116b3599ce055539de74766e95
