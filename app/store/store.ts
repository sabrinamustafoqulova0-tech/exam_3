import { configureStore } from "@reduxjs/toolkit"
import { authApi } from "../services/authApi"
import { reelsApi } from "../services/Reels"
import notificationReducer from "./notificationSlice"

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [reelsApi.reducerPath]: reelsApi.reducer,
    notifications: notificationReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(reelsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch