import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import BlogPost from "./components/BlogPost/BlogPost";
import HomePage from "./components/HomePage/HomePage";
import Layout from "./components/Layout/Layout";

const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{
				path: "/",
				element: <HomePage />,
			},
			{
				path: "blog",
				element: <Outlet />,
				children: [
					{
						path: ":postId",
						element: <BlogPost />,
					},
				],
			},
		],
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
