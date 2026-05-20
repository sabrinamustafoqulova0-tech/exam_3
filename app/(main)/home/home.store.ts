import { MyAxios } from "../../utils/token";

const getUserProfile = async (userId: string) => {
  try {
    const res = await MyAxios.get(`/UserProfile/get-user-profile-by-id?id=${userId}`);
    return res.data?.data || res.data || null;
  } catch {
    return null;
  }
};

export const getStories = async () => {
  try {
    const response = await MyAxios.get("/Story/get-stories");
    const result = response.data?.data ?? response.data ?? [];
    const stories = Array.isArray(result) ? result : [];

    const enriched = await Promise.all(
      stories.map(async (story: any) => {
        if (story.userId && !story.viewerDto?.userName) {
          const profile = await getUserProfile(story.userId);
          return {
            ...story,
            viewerDto: {
              ...story.viewerDto,
              userName: profile?.userName || profile?.fullName || story.userId,
            },
            userAvatar: story.userAvatar || profile?.image || null,
          };
        }
        return story;
      })
    );

    return enriched;
  } catch {
    return [];
  }
};

export const getPosts = async () => {
  try {
    const response = await MyAxios.get("/Post/get-posts", {
      params: { PageNumber: 1, PageSize: 10 },
    });
    const result = response.data?.data ?? response.data ?? [];
    const posts = Array.isArray(result) ? result : [];

    const enriched = await Promise.all(
      posts.map(async (post: any) => {
        if (post.userId) {
          const profile = await getUserProfile(post.userId);
          return {
            ...post,
            userName: post.userName || profile?.userName || profile?.fullName || "User",
            userAvatar: post.userAvatar || profile?.image || null,
          };
        }
        return post;
      })
    );

    return enriched;
  } catch {
    return [];
  }
};

export const likePostApi = async (postId: number) => {
  try {
    const res = await MyAxios.post(`/Post/like-post?postId=${postId}`, { postId });
    return res.data;
  } catch (error) {
    console.error("Like API error:", error);
    return null;
  }
};
