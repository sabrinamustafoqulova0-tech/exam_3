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

    // ✅ FORGOT PASSWORD (отправка email)
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "/Account/forgot-password",
        method: "POST",
        body: email,
      }),
    }),

    // ✅ RESET PASSWORD (новый пароль + token)
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/Account/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    // ✅ CHANGE PASSWORD (когда пользователь уже вошёл)
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/Account/change-password",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;