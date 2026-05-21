import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Api } from "../utils/token";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: Api,
    prepareHeaders: (headers) => {
      // Подставляем правильный ключ из твоего Local Storage
      const token = localStorage.getItem("store_token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["MyProfile"],
  endpoints: (builder) => ({
    // --- ACCOUNT ---
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
    forgotPassword: builder.mutation({
      query: () => ({
        url: "/Account/ForgotPassword",
        method: "DELETE",
      }),
    }),
    resetPassword: builder.mutation({
      query: () => ({
        url: "/Account/ResetPassword",
        method: "DELETE",
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/Account/ChangePassword",
        method: "PUT",
        body: data,
      }),
    }),

    // --- USER PROFILE ---
    getUserProfileById: builder.query({
      query: (id) => `/UserProfile/get-user-profile-by-id?id=${id}`,
    }),
    getIsFollowUserProfileById: builder.query({
      query: (id) => `/UserProfile/get-is-follow-user-profile-by-id?id=${id}`,
    }),
    getMyProfile: builder.query({
      query: () => "/UserProfile/get-my-profile",
      providesTags: ["MyProfile"],
    }),
    updateUserProfile: builder.mutation({
      query: (profile) => ({
        url: "/UserProfile/update-user-profile",
        method: "PUT",
        body: profile,
      }),
      invalidatesTags: ["MyProfile"],
    }),
    getPostFavorites: builder.query({
      query: () => "/UserProfile/get-post-favorites",
    }),
    updateUserImageProfile: builder.mutation({
      query: (image) => ({
        url: "/UserProfile/update-user-image-profile",
        method: "PUT",
        body: image,
      }),
      invalidatesTags: ["MyProfile"],
    }),
    deleteUserImageProfile: builder.mutation({
      query: () => ({
        url: "/UserProfile/delete-user-image-profile",
        method: "DELETE",
      }),
    }),

    // --- FOLLOWING RELATION SHIP ---
    getSubscribers: builder.query({
      query: () => "/FollowingRelationShip/get-subscribers",
    }),
    getSubscriptions: builder.query({
      query: () => "/FollowingRelationShip/get-subscriptions",
    }),
    addFollowingRelationShip: builder.mutation({
      query: (data) => ({
        url: "/FollowingRelationShip/add-following-relation-ship",
        method: "POST",
        body: data,
      }),
    }),
    deleteFollowingRelationShip: builder.mutation({
      query: () => ({
        url: "/FollowingRelationShip/delete-following-relation-ship",
        method: "DELETE",
      }),

    }),
    addPost: builder.mutation<any, FormData>({
      query: (body) => ({
        url: "/Post/add-post", // Проверь точный путь к добавлению постов/reels в Swagger
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyProfile"],
    }), 
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetUserProfileByIdQuery,
  useGetIsFollowUserProfileByIdQuery,
  useGetMyProfileQuery,
  useUpdateUserProfileMutation,
  useGetPostFavoritesQuery,
  useUpdateUserImageProfileMutation,
  useDeleteUserImageProfileMutation,
  useGetSubscribersQuery,
  useGetSubscriptionsQuery,
  useAddFollowingRelationShipMutation,
  useDeleteFollowingRelationShipMutation,
  useAddPostMutation,
} = profileApi;