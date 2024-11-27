import { Outlet } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import "./index.css";

function Layout() {
	return (
		<div id="Layout">
			<Navigation />
			<Outlet />
		</div>
	);
}

export default Layout;
