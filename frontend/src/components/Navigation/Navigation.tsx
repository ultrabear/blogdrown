import "./Navigation.css";
import { Link } from "react-router-dom";
import ProfileNav from "./ProfileNav";

function Navigation() {
	// TODO following spacing
	return (
		<div id="Navigation">
			<div className="Home link obvious">
				<Link to="/">Home</Link>
				{" "}
				<Link to="/following">Following</Link>
			</div>
			<h1 className="link">
				<Link to="/">BlogDrown</Link>
			</h1>
			<ProfileNav />
		</div>
	);
}

export default Navigation;
