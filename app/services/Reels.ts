import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { Api } from "../utils/token"

export interface IComment {
  postCommentId: number
  userId: string
  userName: string
  userImage: string | null
  dateCommented: string
  comment: string
}


export interface IReel {
  postId: number
  userId: string
  userName: string
  userImage: string | null
  images: string
  datePublished: string
  postLike: boolean
  postLikeCount: number
  userLikes: unknown[]
  commentCount: number
  comments: IComment[]
  postView: number
  userViews: unknown[]
  postFavorite: boolean
  userFavorite: unknown[]
  title: string | null
  content: string | null
}

interface IGetReelsParams {
  PageNumber?: number
  PageSize?: number
}

export const reelsApi = createApi({
  reducerPath: "reelsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: Api,

    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("store_token")

        if (token) {
          const cleanedToken = token.replaceAll('"', "")
          headers.set("Authorization", `Bearer ${cleanedToken}`)
        }
      }

      return headers
    },
  }),

  tagTypes: ["Reels"],

  endpoints: (builder) => ({
    getReels: builder.query<IReel[], IGetReelsParams | void>({
      query: (params) => ({
        url: "/Post/get-reels",
        method: "GET",
        params: {
          PageNumber: params?.PageNumber ?? 1,
          PageSize: params?.PageSize ?? 15,
        },
      }),

      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response
        if (Array.isArray(response?.data)) return response.data
        if (Array.isArray(response?.data?.data)) return response.data.data
        return []
      },

      providesTags: ["Reels"],
    }),

    likePost: builder.mutation<void, number>({
      query: (postId) => ({
        url: "/Post/like-post",
        method: "POST",
        params: { postId },
      }),
    }),

    addComment: builder.mutation<void, { comment: string; postId: number }>({
      query: (body) => ({
        url: "/Post/add-comment",
        method: "POST",
        body,
      }),
    }),

    addFavorite: builder.mutation<void, number>({
      query: (postId) => ({
        url: "/Post/add-post-favorite",
        method: "POST",
        body: { postId },
      }),
    }),

    addFollowing: builder.mutation<void, string>({
      query: (followingUserId) => ({  
        url: "/FollowingRelationShip/add-following-relation-ship",
        method: "POST",
        params: { followingUserId },
      }),
    }),

    deleteFollowing: builder.mutation<void, string>({
      query: (followingUserId) => ({
        url: "/FollowingRelationShip/delete-following-relation-ship",
        method: "DELETE",
        params: { followingUserId },
      }),
    }),

    addPost: builder.mutation<void, { title: string; content: string; images: File[] }>({
      query: ({ title, content, images }) => {
        const formData = new FormData()
        formData.append("Title", title)
        formData.append("Content", content)
        images.forEach((file) => formData.append("Images", file))
        return {
          url: "/Post/add-post",
          method: "POST",
          body: formData,
        }
      },
      invalidatesTags: ["Reels"],
    }),
  }),
})


export const {
  useGetReelsQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useAddFavoriteMutation,
  useAddFollowingMutation,
  useDeleteFollowingMutation,
  useAddPostMutation,
} = reelsApi