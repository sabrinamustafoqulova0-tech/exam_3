import { createApi } from "@reduxjs/toolkit/query/react";
import { MyAxios } from "../utils/token";

export const storyApi = createApi({
  reducerPath: "storyApi",

  baseQuery: async ({ url, method, data, params }) => {
    try {
      const result = await MyAxios({
        url,
        method,
        data,
        params,
      });

      return { data: result.data };
    } catch (axiosError: any) {
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        },
      };
    }
  },

  endpoints: (builder) => ({


    getStories: builder.query({
  async queryFn() {
    try {
      const response = await MyAxios.get("/Story/get-stories");
      const data = response.data ?? [];

      // разворачиваем: каждый пользователь → его сторисы
      const enriched: any[] = [];

      data.forEach((user: any) => {
        user.stories?.forEach((story: any) => {
          if (story.fileName) { // только сторисы с картинкой
            enriched.push({
              ...story,
              userName: user.userName,
              userAvatar: user.userImage || null,
              userId: user.userId,
            });
          }
        });
      });

      return { data: enriched };
    } catch (error: any) {
      return { error: error.message };
    }
  },
}),

likeStory: builder.mutation({
  query: (storyId: number) => ({
    url: `/Story/LikeStory?storyId=${storyId}`,
    method: "POST",
  }),
}),

addStoryView: builder.mutation({
  query: (storyId: number) => ({
    url: `/Story/add-story-view?StoryId=${storyId}`,
    method: "POST",
  }),
}),


  }),
});

export const {
  useGetStoriesQuery,
  useAddStoryViewMutation,
  useLikeStoryMutation
} = storyApi;