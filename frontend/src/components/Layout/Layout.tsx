import { Outlet, ScrollRestoration } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import "./index.css";
import { useContext } from "react";
import { useAppDispatch } from "../../store";
import { sessionAuth } from "../../store/session";
import { SessionLoading } from "./Session";

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
