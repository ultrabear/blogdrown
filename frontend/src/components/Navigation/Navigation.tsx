import "./Navigation.css";
import { Link } from "react-router-dom";

function Navigation() {
	return (
		<div id="Navigation">
			<div className="link">
				<Link to="/">Home</Link>
			</div>
			<h1>BlogDrown</h1>
		</div>
	);
}

export default Navigation;
