import { configureStore } from "@reduxjs/toolkit";
import { storyApi } from "../services/home.store";
import { postApi } from "../services/publication.home";

export const store = configureStore({
  reducer: {
    [storyApi.reducerPath]: storyApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      storyApi.middleware,
      postApi.middleware
    ),
});
