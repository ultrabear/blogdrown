import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
import { type GetAllPostsItem, api } from "./api";
import type { BlogPost, BlogPostSlice } from "./types";
import { userSlice } from "./users";

function bulkPostToStore(b: GetAllPostsItem): BlogPost {
	return {
		id: b.id,
		partial: true,
		text: b.partial_body,
		title: b.title,
		norm: b.title_norm,
		owner_id: b.user.id,
		created_at: b.created_at,
		updated_at: b.updated_at,
	};
}

export const getAll = createAsyncThunk(
	"blogPosts/getAll",
	async (_: undefined, { dispatch }) => {
		const res = await api.blogs.getAll();

		dispatch(blogPostSlice.actions.loadPosts(res.map(bulkPostToStore)));
		dispatch(userSlice.actions.addUsers(res.map((p) => p.user)));
	},
);

const initialState: BlogPostSlice = {};

export const blogPostSlice = createSlice({
	name: "blogPosts",
	initialState,
	reducers: {
		loadPost: (state, action: PayloadAction<BlogPost>) => {
			state[action.payload.id] = action.payload;
		},
		loadPosts: (state, action: PayloadAction<BlogPost[]>) => {
			for (const post of action.payload) {
				state[post.id] = post;
			}
		},
	},
});

export default blogPostSlice.reducer;
