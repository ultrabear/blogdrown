import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import HomePage from "./components/HomePage/HomePage";
import Navigation from "./components/Navigation/Navigation";

function Layout() {
	return (
		<div id="Layout">
			<Navigation />
			<Outlet />
		</div>
	);
}

const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{
				path: "/",
				element: <HomePage />,
			},
		],
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
