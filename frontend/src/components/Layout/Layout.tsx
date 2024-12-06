import { Outlet, ScrollRestoration } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import "./index.css";
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../store";
import { getFollows, sessionAuth } from "../../store/session";
import { SessionLoading } from "./Session";

function Layout() {
	const dispatch = useAppDispatch();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		dispatch(sessionAuth()).then(() => {
			setLoading(false);
		});
		dispatch(getFollows());
	}, [dispatch]);

	return (
		<div id="Layout">
			<SessionLoading.Provider value={loading}>
				<ScrollRestoration />
				<Navigation />
				<Outlet />
			</SessionLoading.Provider>
		</div>
	);
}

export default Layout;
