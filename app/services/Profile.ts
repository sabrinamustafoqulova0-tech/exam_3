import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Api } from "../utils/token";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: Api,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("store_token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  // Теги для управления кэшем и автоматического обновления интерфейса
  tagTypes: ["MyProfile", "UserProfile", "FollowStatus", "AllPosts", "Subscribers", "Subscriptions"],
  endpoints: (builder) => ({
    // ==========================================
    // 1. ACCOUNT (АВТОРИЗАЦИЯ И СБРОС ПАРОЛЕЙ)
    // ==========================================
    register: builder.mutation({ 
      query: (user) => ({ url: "/Account/register", method: "POST", body: user }) 
    }),
    login: builder.mutation({ 
      query: (user) => ({ url: "/Account/login", method: "POST", body: user }) 
    }),
    forgotPassword: builder.mutation({ 
      query: () => ({ url: "/Account/ForgotPassword", method: "DELETE" }) 
    }),
    resetPassword: builder.mutation({ 
      query: () => ({ url: "/Account/ResetPassword", method: "DELETE" }) 
    }),
    changePassword: builder.mutation({ 
      query: (data) => ({ url: "/Account/ChangePassword", method: "PUT", body: data }) 
    }),

    // ==========================================
    // 2. USER PROFILE (ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ)
    // ==========================================
    getUserProfileById: builder.query({
      query: (id) => `/UserProfile/get-user-profile-by-id?id=${id}`,
      providesTags: (result, error, id) => [{ type: "UserProfile", id }],
    }),
    getIsFollowUserProfileById: builder.query({
      query: (id) => `/UserProfile/get-is-follow-user-profile-by-id?id=${id}`,
      providesTags: (result, error, id) => [{ type: "FollowStatus", id }],
    }),
    getMyProfile: builder.query({
      query: () => "/UserProfile/get-my-profile",
      providesTags: ["MyProfile"],
    }),
    updateUserProfile: builder.mutation({
      query: (profile) => ({ url: "/UserProfile/update-user-profile", method: "PUT", body: profile }),
      invalidatesTags: ["MyProfile"],
    }),
    getPostFavorites: builder.query({
      query: () => "/UserProfile/get-post-favorites",
    }),
    updateUserImageProfile: builder.mutation({
      query: (image) => ({ url: "/UserProfile/update-user-image-profile", method: "PUT", body: image }),
      invalidatesTags: ["MyProfile"],
    }),
    deleteUserImageProfile: builder.mutation({
      query: () => ({ url: "/UserProfile/delete-user-image-profile", method: "DELETE" }),
      invalidatesTags: ["MyProfile"],
    }),

    // ==========================================
    // 3. FOLLOWING RELATION SHIP (ПОДПИСКИ)
    // ==========================================
    getSubscribers: builder.query({ query: () => "/FollowingRelationShip/get-subscribers", providesTags: ["Subscribers"] }),
    getSubscriptions: builder.query({ query: () => "/FollowingRelationShip/get-subscriptions", providesTags: ["Subscriptions"] }),
    
    addFollowingRelationShip: builder.mutation({
      query: (userId) => ({
        url: `/FollowingRelationShip/add-following-relation-ship?followingUserId=${userId}`,
        method: "POST",
      }),
      // Перезапрашиваем данные профиля и статус кнопки, чтобы счетчик сразу изменился
      invalidatesTags: (result, error, userId) => [
        "MyProfile",
        "Subscribers",
        "Subscriptions",
        { type: "UserProfile", id: userId },
        { type: "FollowStatus", id: userId }
      ],
    }),
    deleteFollowingRelationShip: builder.mutation({
      query: (userId) => ({
        url: `/FollowingRelationShip/delete-following-relation-ship?followingUserId=${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, userId) => [
        "MyProfile",
        "Subscribers",
        "Subscriptions",
        { type: "UserProfile", id: userId },
        { type: "FollowStatus", id: userId }
      ],
    }),

    // ==========================================
    // 4. POST (ПУБЛИКАЦИИ И ЛАЙКИ)
    // ==========================================
    getPosts: builder.query({
      query: () => "/Post/get-posts",
      providesTags: ["AllPosts"],
    }),
    getMyPosts: builder.query({ 
      query: () => "/Post/get-my-posts",
      providesTags: ["AllPosts"],
    }),
   getPostById: builder.query({
  query: (id) => `/Post/get-post-by-id?id=${id}`,
    providesTags: (result, error, id) => [{ type: 'AllPosts', id }],
}),
    addPost: builder.mutation<any, FormData>({
      query: (body) => ({
        url: "/Post/add-post",
        method: "POST",
        body, // Сюда передаем FormData с Title, Content и Images[]
      }),
      invalidatesTags: ["AllPosts"],
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/Post/delete-post?id=${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AllPosts"],
    }),
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/Post/like-post?postId=${postId}`,
        method: "POST",
      }),
      invalidatesTags: ["AllPosts"],
    }),
    addComment: builder.mutation({
      query: ({ postId, commentText }) => ({
        url: `/Post/add-comment`,
        method: "POST",
        body: { comment: commentText, postId: postId },
      }),
      invalidatesTags: ["AllPosts"],
    }),
    
    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `/Post/delete-comment?commentId=${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AllPosts"],
    }),
    addPostFavorite: builder.mutation({
      query: (postId) => ({
        url: `/Post/add-post-favorite?postId=${postId}`,
        method: "POST",
      }),
    }),
  }),
});

// Экспортируем абсолютно все хуки, которые могут понадобиться в приложении
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
  useGetMyPostsQuery,
  useGetPostsQuery,
  useGetPostByIdQuery,
  useAddPostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  
} = profileApi; 