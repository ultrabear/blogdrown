import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { User, UserSlice } from "./types";

const initialState: UserSlice = {};

export const userSlice = createSlice({
	name: "users",
	initialState,
	reducers: {
		addUsers: (state, action: PayloadAction<User[]>) => {
			for (const user of action.payload) {
				state[user.id] = user;
			}
		},
	},
});

export default userSlice.reducer;
