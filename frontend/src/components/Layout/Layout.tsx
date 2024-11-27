import { Outlet } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import "./index.css";
import { useEffect } from "react";
import { useAppDispatch } from "../../store";
import { sessionAuth } from "../../store/session";

function Layout() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(sessionAuth());
	}, [dispatch]);

	return (
		<div id="Layout">
			<Navigation />
			<Outlet />
		</div>
	);
}

export default Layout;
