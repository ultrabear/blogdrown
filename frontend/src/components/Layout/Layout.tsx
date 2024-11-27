import { Outlet, ScrollRestoration } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import "./index.css";
import { createContext, useContext } from "react";
import { useAppDispatch } from "../../store";
import { sessionAuth } from "../../store/session";

export const SessionLoading = createContext({ loading: true });

function Layout() {
	const dispatch = useAppDispatch();
	const loading = useContext(SessionLoading);

	dispatch(sessionAuth()).then(() => {
		loading.loading = false;
	});

	return (
		<div id="Layout">
			<ScrollRestoration />
			<Navigation />
			<Outlet />
		</div>
	);
}

export default Layout;
