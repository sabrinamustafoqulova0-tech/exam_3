import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Api } from "../utils/token";

type ApiResponse<T> = {
  data: T;
  errors: any[];
  statusCode: number;
};

const getCurrentUserIdFromToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("store_token");
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(decoded);
    return parsed?.sid || parsed?.nameid || parsed?.sub || parsed?.userId || null;
  } catch {
    return null;
  }
};


export type UserShortInfo = {
  userId: string;
  userName: string;
  userPhoto: string;
  fullname: string;
};

export type FollowingRelationItem = {
  id: number;
  userShortInfo: UserShortInfo;
};

type GetPostsParams = {
  UserId?: string;
  Title?: string;
  Content?: string;
  PageNumber?: number;
  PageSize?: number;
};

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
  tagTypes: ["MyProfile", "UserProfile", "FollowStatus", "AllPosts", "AllReels", "Subscribers", "Followers", "Subscriptions", "Favorites", "Stories", "SearchHistory"],
  endpoints: (builder) => ({
    // ==========================================
    // 1. ACCOUNT
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
    // 2. USER PROFILE
    // ==========================================
    getUserProfileById: builder.query({
      query: (id) => `/UserProfile/get-user-profile-by-id?id=${id}`,
      providesTags: (result, error, id) => [{ type: "UserProfile", id }],
    }),
    getIsFollowUserProfileById: builder.query({
      // ИСПРАВЛЕНО строго под Swagger: параметр называется followingUserId
      query: (id) => `/UserProfile/get-is-follow-user-profile-by-id?followingUserId=${id}`,
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
      query: ({ PageNumber = 1, PageSize = 10 } = {}) => 
        `/UserProfile/get-post-favorites?PageNumber=${PageNumber}&PageSize=${PageSize}`,
      providesTags: ["Favorites"]
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
    // 3. FOLLOWING RELATION SHIP
    // ==========================================
    getSubscribers: builder.query<ApiResponse<FollowingRelationItem[]>, string>({
      query: (userId) => {
        const targetId = userId?.toString().trim() || getCurrentUserIdFromToken() || "";
        return {
          url: "/FollowingRelationShip/get-subscribers",
          method: "GET",
          params: { UserId: targetId },
        };
      },
      providesTags: ["Followers"],
    }),
    getSubscriptions: builder.query<ApiResponse<FollowingRelationItem[]>, string>({
      query: (userId) => {
        const targetId = userId?.toString().trim() || getCurrentUserIdFromToken() || "";
        return {
          url: "/FollowingRelationShip/get-subscriptions",
          method: "GET",
          params: { UserId: targetId },
        };
      },
      providesTags: ["Subscriptions"],
    }),
    addFollowingRelationShip: builder.mutation({
      query: (userId) => ({
        url: `/FollowingRelationShip/add-following-relation-ship?followingUserId=${userId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, userId) => [
        "MyProfile", "Followers", "Subscriptions",
        { type: "UserProfile", id: userId }, { type: "FollowStatus", id: userId }
      ],
    }),
    deleteFollowingRelationShip: builder.mutation<ApiResponse<any>, string>({
      query: (userId) => {
        const targetId = userId?.toString().trim() || getCurrentUserIdFromToken() || "";
        return {
          url: "/FollowingRelationShip/delete-following-relation-ship",
          method: "DELETE",
          params: { UserId: targetId },
        };
      },
      invalidatesTags: ["Subscriptions"],
    }),

    // ==========================================
    // 4. POST & REELS
    // ==========================================
    getPosts: builder.query<ApiResponse<any>, GetPostsParams | void>({
      query: (params) => ({
        url: "/Post/get-posts",
        method: "GET",
        params: {
          UserId: params?.UserId || undefined,
          Title: params?.Title || undefined,
          Content: params?.Content || undefined,
          PageNumber: params?.PageNumber ?? 1,
          PageSize: params?.PageSize ?? 10,
        },
      }),
      transformResponse: (response: any) => response,
      providesTags: ["AllPosts"],
    }),
    getReels: builder.query({
      query: () => "/Post/get-reels",
      providesTags: ["AllReels"],
    }),
    getMyPosts: builder.query({ 
      query: () => "/Post/get-my-posts",
      providesTags: ["AllPosts"],
    }),
    getFollowingPost: builder.query({
      query: () => "/Post/get-following-post",
      providesTags: ["AllPosts"],
    }),
    getPostById: builder.query({
      query: (id) => `/Post/get-post-by-id?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'AllPosts', id }],
    }),
    addPost: builder.mutation<any, FormData>({
      query: (body) => ({ url: "/Post/add-post", method: "POST", body }),
      invalidatesTags: ["AllPosts", "AllReels"],
    }),
    deletePost: builder.mutation({
      query: (postId) => ({ url: `/Post/delete-post?id=${postId}`, method: "DELETE" }),
      invalidatesTags: ["AllPosts", "AllReels"],
    }),
    putPostSetting: builder.mutation({
      query: (postData) => ({ url: "/Post/put-post-setting", method: "PUT", body: postData }),
      invalidatesTags: ["AllPosts", "AllReels"],
    }),
    putImg: builder.mutation<any, FormData>({
      query: (formData) => ({ url: "/Post/put-img", method: "PUT", body: formData }),
      invalidatesTags: ["AllPosts", "AllReels"],
    }),
    uploadMp4: builder.mutation<any, FormData>({
      query: (formData) => ({ url: "/Post/upload-mp4", method: "POST", body: formData }),
      invalidatesTags: ["AllReels"],
    }),
    likePost: builder.mutation({
      query: (postId) => ({ url: `/Post/like-post?postId=${postId}`, method: "POST" }),
      invalidatesTags: ["AllPosts", "AllReels"],
    }),
    viewPost: builder.mutation({
      query: (postId) => ({ url: `/Post/view-post?postId=${postId}`, method: "POST" }),
    }),
    addComment: builder.mutation({
      query: ({ postId, commentText }) => ({
        url: `/Post/add-comment`,
        method: "POST",
        body: { comment: commentText, postId: postId },
      }),
      invalidatesTags: ["AllPosts", "AllReels"],
    }),
    deleteComment: builder.mutation({
      query: (commentId) => ({ url: `/Post/delete-comment?commentId=${commentId}`, method: "DELETE" }),
      invalidatesTags: ["AllPosts", "AllReels"],
    }),
    addPostFavorite: builder.mutation({
      query: (postId) => ({ url: `/Post/add-post-favorite?postId=${postId}`, method: "POST" }),
      invalidatesTags: ["Favorites", "AllPosts"],
    }),

    // ==========================================
    // 5. STORY
    // ==========================================
    getStories: builder.query({
      query: () => "/Story/get-stories",
      providesTags: ["Stories"],
    }),
    getUserStories: builder.query({
      query: (userId) => `/Story/get-user-stories/${userId}`,
      providesTags: ["Stories"],
    }),
    getMyStories: builder.query({
      query: () => "/Story/get-my-stories",
      providesTags: ["Stories"],
    }),
    getStoryById: builder.query({
      query: (id) => `/Story/GetStoryById?id=${id}`,
      providesTags: ["Stories"],
    }),
    addStories: builder.mutation({
      query: (body) => ({ url: "/Story/AddStories", method: "POST", body }),
      invalidatesTags: ["Stories"],
    }),
    deleteStory: builder.mutation({
      query: (id) => ({ url: `/Story/DeleteStory?id=${id}`, method: "DELETE" }),
      invalidatesTags: ["Stories"],
    }),
    likeStory: builder.mutation({
      query: (storyId) => ({ url: `/Story/LikeStory?storyId=${storyId}`, method: "POST" }),
      invalidatesTags: ["Stories"],
    }),
    addStoryView: builder.mutation({
      query: (storyId) => ({ url: `/Story/add-story-view?storyId=${storyId}`, method: "POST" }),
    }),

    // ==========================================
    // 6. USER & SEARCH
    // ==========================================
    getUsers: builder.query({
      query: () => "/User/get-users",
    }),
    getSearchHistories: builder.query({
      query: () => "/User/get-search-histories",
      providesTags: ["SearchHistory"],
    }),
    addSearchHistory: builder.mutation({
      query: (searchedUserId) => ({ url: `/User/add-search-history?searchedUserId=${searchedUserId}`, method: "POST" }),
      invalidatesTags: ["SearchHistory"],
    }),
    deleteSearchHistory: builder.mutation({
      query: (id) => ({ url: `/User/delete-search-history?id=${id}`, method: "DELETE" }),
      invalidatesTags: ["SearchHistory"],
    }),
    deleteSearchHistories: builder.mutation({
      query: () => ({ url: "/User/delete-search-histories", method: "DELETE" }),
      invalidatesTags: ["SearchHistory"],
    }),
    deleteUser: builder.mutation({
      query: () => ({ url: "/User/delete-user", method: "DELETE" }),
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
  useGetMyPostsQuery,
  useGetPostsQuery,
  useGetPostByIdQuery,
  useAddPostMutation,
  useDeletePostMutation,
  usePutPostSettingMutation,
  usePutImgMutation,
  useUploadMp4Mutation,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useGetReelsQuery,
  useGetFollowingPostQuery,
  useViewPostMutation,
  useGetStoriesQuery,
  useGetUserStoriesQuery,
  useGetMyStoriesQuery,
  useGetStoryByIdQuery,
  useAddStoriesMutation,
  useDeleteStoryMutation,
  useLikeStoryMutation,
  useAddStoryViewMutation,
  useGetUsersQuery,
  useGetSearchHistoriesQuery,
  useAddSearchHistoryMutation,
  useDeleteSearchHistoryMutation,
  useDeleteSearchHistoriesMutation,
  useDeleteUserMutation,
} = profileApi;