import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App";
import { CurrentUserProvider } from "./auth/CurrentUser";

import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NewPost from "./pages/NewPost";
import PostDetail from "./pages/PostDetail";
import Hashtag from "./pages/Hashtag";
import Hashtags from "./pages/Hashtags";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Graph from "./pages/Graph";

import AdminData from "./pages/admin/AdminData";
import AdminBulk from "./pages/admin/AdminBulk";
import AdminIngest from "./pages/admin/AdminIngest";
import AdminGDS from "./pages/admin/AdminGDS";
import AdminDelete from "./pages/admin/AdminDelete";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<App />}>
              <Route index element={<Feed />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/profile/:userId/edit" element={<EditProfile />} />
              <Route path="/post/new" element={<NewPost />} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/hashtags" element={<Hashtags />} />
              <Route path="/hashtag/:name" element={<Hashtag />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<GroupDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:userId" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/graph" element={<Graph />} />

              <Route path="/admin" element={<AdminData />} />
              <Route path="/admin/bulk" element={<AdminBulk />} />
              <Route path="/admin/ingest" element={<AdminIngest />} />
              <Route path="/admin/gds" element={<AdminGDS />} />
              <Route path="/admin/delete" element={<AdminDelete />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CurrentUserProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            color: "#fafafa",
            border: "1px solid #262626",
            borderRadius: "12px",
            fontSize: "13px",
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
