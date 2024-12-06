import "./Navigation.css";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../store";
import ProfileNav from "./ProfileNav";

function Navigation() {
	const sessionExists = useAppSelector((state) => state.session.user !== null);

	return (
		<div id="Navigation">
			<div className="Home link obvious">
				<Link to="/">Home</Link>
				{sessionExists && <Link to="/following">Following</Link>}
			</div>
			<h1 className="link">
				<Link to="/">BlogDrown</Link>
			</h1>
			<ProfileNav />
		</div>
	);
}

export default Navigation;
