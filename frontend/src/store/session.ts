import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";
import { ApiError, type Login, type Signup, api } from "./api";
import type { SessionSlice, SessionUser } from "./types";

async function catchError(
	cb: () => Promise<void>,
): Promise<undefined | ApiError> {
	try {
		await cb();
	} catch (e) {
		if (e instanceof ApiError) {
			return e;
		}
		throw e;
	}
}

export const sessionAuth = createAsyncThunk(
	"session/authMe",
	async (_: undefined, { dispatch }) => {
		const session = await api.auth.session();

		dispatch(sessionSlice.actions.setSession(session));
	},
);

export const sessionLogin = createAsyncThunk(
	"session/login",
	async (login: Login, { dispatch }) =>
		await catchError(async () => {
			const session = await api.auth.login(login);

			dispatch(sessionSlice.actions.setSession(session));
		}),
);

export const sessionSignup = createAsyncThunk(
	"session/signup",
	async (signup: Signup, { dispatch }) =>
		await catchError(async () => {
			const session = await api.auth.signup(signup);

			dispatch(sessionSlice.actions.setSession(session));
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
