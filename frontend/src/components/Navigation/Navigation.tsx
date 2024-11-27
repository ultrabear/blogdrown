import "./Navigation.css";
import { Link } from "react-router-dom";
import ProfileNav from "./ProfileNav";

function Navigation() {
	return (
		<div id="Navigation">
			<div className="Home link obvious">
				<Link to="/">Home</Link>
			</div>
			<h1>BlogDrown</h1>
			<ProfileNav />
		</div>
	);
}

export default Navigation;
