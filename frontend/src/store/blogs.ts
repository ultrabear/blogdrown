import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
import type { RootState } from ".";
import {
	type ApiError,
	type GetAllPostsItem,
	type GetPostRes,
	type NewBlogPost,
	type NewBlogPostRes,
	type UpdateBlogPost,
	api,
	catchError,
} from "./api";
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
	(id: string, { dispatch }): Promise<ApiError | undefined> =>
		catchError(async () => {
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
		}),
);

export const createBlogPost = createAsyncThunk(
	"blogPosts/createBlogPost",
	(
		post: NewBlogPost,
		{ dispatch, getState },
	): Promise<ApiError | NewBlogPostRes> =>
		catchError(async () => {
			const state = getState() as RootState;
			const authorId = state.session.user!.id;

			const res = await api.blogs.create(post);

			const { title_norm, ...rest } = res;

			dispatch(
				blogPostSlice.actions.loadPost({
					...rest,
					norm: title_norm,
					title: post.title,
					text: post.body,
					partial: false,
					owner_id: authorId,
				}),
			);

			return res;
		}),
);

export const editBlogPost = createAsyncThunk(
	"blogPosts/editBlogPost",
	(post: UpdateBlogPost & { id: string }, { dispatch }) =>
		catchError(async () => {
			const res = await api.blogs.update(post.id, { body: post.body });

			dispatch(
				blogPostSlice.actions.editPost({ ...post, updated_at: res.updated_at }),
			);

			return res;
		}),
);

const initialState: BlogPostSlice = {};

export const blogPostSlice = createSlice({
	name: "blogPosts",
	initialState,
	reducers: {
		editPost: (
			state,
			action: PayloadAction<{ id: string; updated_at: string; body: string }>,
		) => {
			const { id, updated_at, body } = action.payload;

			if (id in state) {
				state[id]!.updated_at = updated_at;
				state[id]!.text = body;
			}
		},
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
