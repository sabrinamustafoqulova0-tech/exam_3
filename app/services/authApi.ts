import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Api } from "../utils/token";

export const authApi = createApi({
  reducerPath: "authApi",

  baseQuery: fetchBaseQuery({
    baseUrl: Api,
  }),

  endpoints: (builder) => ({
    register: builder.mutation({
      query: (user) => ({
        url: "/Account/register",
        method: "POST",
        body: user,
      }),
    }),

    login: builder.mutation({
      query: (user) => ({
        url: "/Account/login",
        method: "POST",
        body: user,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
} = authApi;