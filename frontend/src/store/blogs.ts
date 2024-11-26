import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
import { ApiError, type GetAllPostsItem, type GetPostRes, api } from "./api";
import { apiCommentToStore, commentSlice } from "./comments";
import type { BlogPost, BlogPostSlice } from "./types";
import { userSlice } from "./users";

function bulkPostToStore(b: GetAllPostsItem): BlogPost {
	const { user, title_norm, partial_body, ...rest } = b;

	return {
		...rest,
		partial: true,
		text: partial_body,
		norm: title_norm,
		owner_id: user.id,
	};
}

function singlePostToStore(b: GetPostRes): BlogPost {
	const { user, title_norm, body, comments: _, ...rest } = b;

	return {
		...rest,
		partial: false,
		norm: title_norm,
		text: body,
		owner_id: user.id,
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

export const getOneBlog = createAsyncThunk(
	"blogPosts/getOneBlog",
	async (id: string, { dispatch }): Promise<ApiError | undefined> => {
		try {
			const res = await api.blogs.getOne(id);

			dispatch(blogPostSlice.actions.loadPost(singlePostToStore(res)));
			dispatch(
				userSlice.actions.addUsers(
					res.comments.map((c) => c.author).concat([res.user]),
				),
			);
			dispatch(
				commentSlice.actions.addComments(res.comments.map(apiCommentToStore)),
			);
		} catch (e) {
			if (e instanceof ApiError) {
				return e;
			}
			throw e;
		}
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
				if (post.partial && post.id in state) {
					const oldBody = state[post.id]!.text;

					state[post.id] = post;

					if (oldBody.startsWith(post.text)) {
						state[post.id]!.text = oldBody;
					}
				} else {
					state[post.id] = post;
				}
			}
		},
	},
});

export default blogPostSlice.reducer;
