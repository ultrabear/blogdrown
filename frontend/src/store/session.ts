import { createSlice } from "@reduxjs/toolkit";
import type { SessionSlice } from "./types";

const initialState: SessionSlice = { user: null };

export const sessionSlice = createSlice({
	name: "session",
	initialState,
	reducers: {},
});
