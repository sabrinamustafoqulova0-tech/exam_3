import { MyAxios } from "@/app/utils/token";
import { createApi } from "@reduxjs/toolkit/query/react";

export const postApi = createApi({
  reducerPath: "postApi",

  baseQuery: async ({ url, method, data, params }) => {
    try {
      const result = await MyAxios({
        url,
        method,
        data,
        params,
      });

      return { data: result.data };
    } catch (err: any) {
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data,
        },
      };
    }
  },

  tagTypes: ["Posts", "Comments", "Users", "Follow"],

  endpoints: (builder) => ({
    // ===================== POSTS =====================
    getPosts: builder.query({
      queryFn: async () => {
        try {
          const res = await MyAxios.get("/Post/get-posts", {
            params: { PageNumber: 1, PageSize: 10 },
          });

          const posts = res.data?.data ?? res.data ?? [];

          return { data: posts };
        } catch (e: any) {
          return { error: e.message };
        }
      },
      providesTags: ["Posts"],
    }),

    getFollowingPosts: builder.query({
      query: (userId: string) => ({
        url: `/Post/get-following-post?UserId=${userId}`,
        method: "GET",
      }),
      transformResponse: (response: any) => {
        return response?.data ?? [];
      },
      providesTags: ["Posts"],
    }),

    addPost: builder.mutation({
      query: (formData) => ({
        url: "/Post/add-post",
        method: "POST",
        data: formData,
      }),
      invalidatesTags: ["Posts"],
    }),

    deletePost: builder.mutation({
      query: (postId: number) => ({
        url: `/Post/delete-post?id=${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Posts"],
    }),

    // ===================== LIKE =====================
    likePost: builder.mutation({
      query: (postId: number) => ({
        url: `/Post/like-post?postId=${postId}`,
        method: "POST",
      }),

      invalidatesTags: ["Posts"],
    }),
    favoritePost: builder.mutation({
      query: (postId: number) => ({
        url: `/Post/add-post-favorite`,
        method: "POST",
        data: { postId },
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),

    // ===================== COMMENTS =====================

    getComments: builder.query({
      query: (postId) => ({
        url: `/Comment/get-comments-by-post-id`,
        method: "GET",
        params: { postId },
      }),
      transformResponse: (response: any) => {
        return response?.data ?? response ?? [];
      },
      providesTags: ["Comments"],
    }),

    addComment: builder.mutation({
      query: ({ postId, text }: any) => ({
        url: `/Post/add-comment`,
        method: "POST",
        data: {
          postId: postId,
          comment: text,
        },
      }),
      invalidatesTags: ["Comments", "Posts"],
    }),
    deleteComment: builder.mutation({
      query: (commentId: number) => ({
        url: `/Comment/delete-comment?id=${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comments"],
    }),

    getUsers: builder.query({
      query: () => ({
        url: "/User/get-users?PageSize=400",
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    // string вместо number!
    followUser: builder.mutation({
      query: (userId: string) => ({
        url: `/FollowingRelationShip/add-following-relation-ship?followingUserId=${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Users", "Follow"],
    }),

    deletellowUser: builder.mutation({
      query: (userId: string) => ({
        url: `/FollowingRelationShip/delete-following-relation-ship?followingUserId=${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users", "Follow"],
    }),
    getMyProfile: builder.query({
      query: () => ({
        url: "/UserProfile/get-my-profile",
        method: "GET",
      }),
    }),

    getSubscriptions: builder.query({
      query: (userId: string) => ({
        url: `/FollowingRelationShip/get-subscriptions?UserId=${userId}`, // ✅ get-subscribers
        method: "GET",
      }),
      providesTags: ["Follow"],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetFollowingPostsQuery,
  useLikePostMutation,
  useAddPostMutation,
  useDeletePostMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetUsersQuery,
  useFollowUserMutation,
  useGetMyProfileQuery,
  useGetSubscriptionsQuery,
  useFavoritePostMutation,
  useDeletellowUserMutation,
} = postApi;
