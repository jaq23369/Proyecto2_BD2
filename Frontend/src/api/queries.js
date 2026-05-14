import { api } from "./client";

export const queriesApi = {
  topInfluencers: (limit = 10) =>
    api.get("/queries/top-influencers", { params: { limit } }),
  trendingHashtags: (days = 10000, limit = 10) =>
    api.get("/queries/trending-hashtags", { params: { days, limit } }),
  mostLikedPosts: (limit = 10) =>
    api.get("/queries/most-liked-posts", { params: { limit } }),
  largestGroups: (limit = 10) =>
    api.get("/queries/largest-groups", { params: { limit } }),
  negativeComments: (limit = 10) =>
    api.get("/queries/negative-comments", { params: { limit } }),
  mostActiveUsers: (limit = 10) =>
    api.get("/queries/most-active-users", { params: { limit } }),
};
