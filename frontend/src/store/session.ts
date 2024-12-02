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

const initialState: SessionSlice = { user: null };

export const sessionSlice = createSlice({
	name: "session",
	initialState,
	reducers: {
		setSession: (state, action: PayloadAction<SessionUser>) => {
			state.user = action.payload;
		},
		removeSession: (state) => {
			state.user = null;
		},
	},
});

export default sessionSlice.reducer;
