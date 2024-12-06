import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
import { type Login, type Signup, api, catchError } from "./api";
import type { SessionSlice, SessionUser } from "./types";
import { userSlice } from "./users";

export const sessionAuth = createAsyncThunk(
	"session/authMe",
	(_: undefined, { dispatch }) =>
		catchError(async () => {
			const session = await api.auth.session();

			dispatch(sessionSlice.actions.setSession(session));
			dispatch(
				userSlice.actions.addUsers([
					{ id: session.id, username: session.username },
				]),
			);
		}),
);

export const sessionLogin = createAsyncThunk(
	"session/login",
	(login: Login, { dispatch }) =>
		catchError(async () => {
			const session = await api.auth.login(login);

			dispatch(sessionSlice.actions.setSession(session));
			dispatch(
				userSlice.actions.addUsers([
					{ id: session.id, username: session.username },
				]),
			);
		}),
);

export const sessionSignup = createAsyncThunk(
	"session/signup",
	(signup: Signup, { dispatch }) =>
		catchError(async () => {
			const session = await api.auth.signup(signup);

			dispatch(sessionSlice.actions.setSession(session));
			dispatch(
				userSlice.actions.addUsers([
					{ id: session.id, username: session.username },
				]),
			);
		}),
);

export const sessionLogout = createAsyncThunk(
	"session/logout",
	async (_: undefined, { dispatch }) => {
		api.auth.logout();
		dispatch(sessionSlice.actions.removeSession());
	},
);

export const addFollow = createAsyncThunk(
	"session/addFollow",
	(userId: string, { dispatch }) =>
		catchError(async () => {
			await api.following.addFollow(userId);
			dispatch(sessionSlice.actions.addFollow(userId));
		}),
);

export const removeFollow = createAsyncThunk(
	"session/addFollow",
	(userId: string, { dispatch }) =>
		catchError(async () => {
			await api.following.removeFollow(userId);
			dispatch(sessionSlice.actions.removeFollow(userId));
		}),
);

export const getFollows = createAsyncThunk(
	"session/addFollow",
	(_: undefined, { dispatch }) =>
		catchError(async () => {
			const follows = await api.following.getFollows();

			dispatch(sessionSlice.actions.addFollows(follows.users.map((u) => u.id)));
			dispatch(userSlice.actions.addUsers(follows.users));
		}),
);

const initialState: SessionSlice = { user: null, following: {} };

export const sessionSlice = createSlice({
	name: "session",
	initialState,
	reducers: {
		setSession: (state, action: PayloadAction<SessionUser>) => {
			state.user = action.payload;
		},
		removeSession: (state) => {
			state.user = null;
			state.following = {};
		},
		addFollow: (state, action: PayloadAction<string>) => {
			state.following[action.payload] = true;
		},
		removeFollow: (state, action: PayloadAction<string>) => {
			delete state.following[action.payload];
		},

		addFollows: (state, action: PayloadAction<string[]>) => {
			for (const u of action.payload) {
				state.following[u] = true;
			}
		},
	},
});

export default sessionSlice.reducer;
