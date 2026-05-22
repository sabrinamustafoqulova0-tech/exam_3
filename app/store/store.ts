import { configureStore } from "@reduxjs/toolkit";
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
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      storyApi.middleware,
      postApi.middleware
    ) .concat(authApi.middleware)
      .concat(reelsApi.middleware),
});
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
