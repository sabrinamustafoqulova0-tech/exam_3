import { chatApi } from "./chatApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Comment {
  commentId: number;
  comment: string;
  postId: number;
  userId: string;
  userName: string;
  userImage: string | null;
  commentDate?: string;
  date?: string;
}

export interface Post {
  postId: number;
  id?: number;
  title: string;
  content: string;
  // Real API uses `images` as an array of filenames
  images?: string[] | null;
  // Legacy / fallback fields
  image?: string | null;
  imagePath?: string | null;
  file?: string | null;
  postImages?: string | null;
  // Counts
  postLikeCount?: number;
  postLikes?: number;
  likesCount?: number;
  postView?: number;
  postViewCount?: number;
  postViews?: number;
  viewsCount?: number;
  commentCount?: number;
  // User info
  userId: string;
  userName?: string;
  userImage?: string | null;
  datePublished?: string;
  // State flags — real API uses postLike / postFavorite
  postLike?: boolean;
  postFavorite?: boolean;
  // legacy aliases
  isFavorite?: boolean;
  isLiked?: boolean;
  userFavorite?: null;
  userLikes?: null;
  userViews?: null;
  comments?: Comment[];
}

export interface GetPostsParams {
  UserId?: string;
  Title?: string;
  Content?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface Story {
  id: number;
  fileName: string | null;
  postId: number | null;
  createAt: string;
  userId: string | null;
  userAvatar: string | null;
  userName?: string | null;
}

export interface UserProfile {
  id: string;
  userName: string;
  fullName: string | null;
  avatar: string | null;
  about: string | null;
  gender: number;
  subscribersCount: number;
  subscriptionsCount: number;
  postsCount?: number;
}

// ─── API INJECTION ───────────────────────────────────────────────────────────

export const postApi = chatApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /Post/get-posts?UserId={}&Title={}&Content={}&PageNumber={}&PageSize={}
    getPosts: builder.query<Post[], GetPostsParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.UserId) searchParams.set("UserId", params.UserId);
        if (params?.Title) searchParams.set("Title", params.Title);
        if (params?.Content) searchParams.set("Content", params.Content);
        searchParams.set("PageNumber", String(params?.PageNumber || 1));
        searchParams.set("PageSize", String(params?.PageSize || 100));
        return `/Post/get-posts?${searchParams.toString()}`;
      },
      transformResponse: (response: { data: Post[] }) => response.data || [],
      providesTags: ["Chats"], // reuse existing tag or use custom (it works fine)
    }),

    // GET /Post/get-post-by-id?id={id}
    getPostById: builder.query<Post, number>({
      query: (id) => `/Post/get-post-by-id?id=${id}`,
      transformResponse: (response: { data: Post }) => response.data,
      providesTags: (_result, _error, id) => [{ type: "ChatById", id }],
    }),

    // POST /Post/like-post?postId={id}
    likePost: builder.mutation<any, number>({
      query: (postId) => ({
        url: `/Post/like-post?postId=${postId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, postId) => [
        "Chats",
        { type: "ChatById", id: postId },
      ],
    }),

    // POST /Post/view-post?postId={id}
    viewPost: builder.mutation<any, number>({
      query: (postId) => ({
        url: `/Post/view-post?postId=${postId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: "ChatById", id: postId },
      ],
    }),

    // POST /Post/add-comment        body: { comment: string, postId: number }
    addComment: builder.mutation<any, { comment: string; postId: number }>({
      query: (body) => ({
        url: "/Post/add-comment",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        "Chats",
        { type: "ChatById", id: postId },
      ],
    }),

    // DELETE /Post/delete-comment?commentId={id}
    deleteComment: builder.mutation<any, { commentId: number; postId: number }>({
      query: ({ commentId }) => ({
        url: `/Post/delete-comment?commentId=${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        "Chats",
        { type: "ChatById", id: postId },
      ],
    }),

    // POST /Post/add-post-favorite  body: { postId: number }
    addPostFavorite: builder.mutation<any, { postId: number }>({
      query: (body) => ({
        url: "/Post/add-post-favorite",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        "Chats",
        { type: "ChatById", id: postId },
      ],
    }),

    // POST /Post/add-post           body: FormData { Title, Content, Images: File[] }
    addPost: builder.mutation<any, { Title: string; Content: string; Images: File[] }>({
      query: ({ Title, Content, Images }) => {
        const formData = new FormData();
        formData.append("Title", Title);
        formData.append("Content", Content);
        Images.forEach((img) => {
          formData.append("Images", img);
        });
        return {
          url: "/Post/add-post",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Chats"],
    }),

    // DELETE /Post/delete-post?id={id}
    deletePost: builder.mutation<any, number>({
      query: (id) => ({
        url: `/Post/delete-post?id=${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chats"],
    }),

    // GET /Post/get-my-posts
    getMyPosts: builder.query<Post[], void>({
      query: () => "/Post/get-my-posts",
      transformResponse: (response: { data: Post[] }) => response.data || [],
      providesTags: ["Chats"],
    }),

    // GET /Post/get-following-post?UserId={}&PageNumber={}&PageSize={}
    getFollowingPost: builder.query<Post[], { UserId?: string; PageNumber?: number; PageSize?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.UserId) searchParams.set("UserId", params.UserId);
        searchParams.set("PageNumber", String(params?.PageNumber || 1));
        searchParams.set("PageSize", String(params?.PageSize || 100));
        return `/Post/get-following-post?${searchParams.toString()}`;
      },
      transformResponse: (response: { data: Post[] }) => response.data || [],
      providesTags: ["Chats"],
    }),

    // GET /Post/get-reels?PageNumber={}&PageSize={}
    getReels: builder.query<Post[], { PageNumber?: number; PageSize?: number } | void>({
      query: (params) => {
        const PageNumber = params?.PageNumber || 1;
        const PageSize = params?.PageSize || 100;
        return `/Post/get-reels?PageNumber=${PageNumber}&PageSize=${PageSize}`;
      },
      transformResponse: (response: { data: Post[] }) => response.data || [],
      providesTags: ["Chats"],
    }),

    // GET /Story/get-stories
    getStories: builder.query<Story[], void>({
      query: () => "/Story/get-stories",
      transformResponse: (response: { data: Story[] }) => response.data || [],
      providesTags: ["Chats"],
    }),

    // POST /Story/AddStories       query: PostId, body: FormData { Image }
    addStory: builder.mutation<any, { postId?: number; imageFile: File }>({
      query: ({ postId, imageFile }) => {
        const formData = new FormData();
        formData.append("Image", imageFile);
        const url = postId ? `/Story/AddStories?PostId=${postId}` : "/Story/AddStories";
        return {
          url,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Chats"],
    }),

    // GET /UserProfile/get-my-profile
    getMyProfile: builder.query<UserProfile, void>({
      query: () => "/UserProfile/get-my-profile",
      transformResponse: (response: { data: UserProfile }) => response.data,
      providesTags: ["Chats"],
    }),

    // GET /UserProfile/get-user-profile-by-id?id={id}
    getUserProfileById: builder.query<UserProfile, string>({
      query: (id) => `/UserProfile/get-user-profile-by-id?id=${id}`,
      transformResponse: (response: { data: UserProfile }) => response.data,
      providesTags: ["Chats"],
    }),

    // GET /UserProfile/get-post-favorites?PageNumber={}&PageSize={}
    getPostFavorites: builder.query<Post[], { PageNumber?: number; PageSize?: number } | void>({
      query: (params) => {
        const PageNumber = params?.PageNumber || 1;
        const PageSize = params?.PageSize || 100;
        return `/UserProfile/get-post-favorites?PageNumber=${PageNumber}&PageSize=${PageSize}`;
      },
      transformResponse: (response: { data: Post[] }) => response.data || [],
      providesTags: ["Chats"],
    }),

    // PUT /UserProfile/update-user-profile     body: { about, gender }
    updateUserProfile: builder.mutation<any, { about?: string | null; gender?: number }>({
      query: (body) => ({
        url: "/UserProfile/update-user-profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Chats"],
    }),

    // PUT /UserProfile/update-user-image-profile  body: FormData { imageFile }
    updateUserImageProfile: builder.mutation<any, File>({
      query: (imageFile) => {
        const formData = new FormData();
        formData.append("imageFile", imageFile);
        return {
          url: "/UserProfile/update-user-image-profile",
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["Chats"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useLikePostMutation,
  useViewPostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useAddPostMutation,
  useDeletePostMutation,
  useGetMyPostsQuery,
  useGetFollowingPostQuery,
  useGetReelsQuery,
  useGetStoriesQuery,
  useAddStoryMutation,
  useGetMyProfileQuery,
  useGetUserProfileByIdQuery,
  useGetPostFavoritesQuery,
  useUpdateUserProfileMutation,
  useUpdateUserImageProfileMutation,
} = postApi;
