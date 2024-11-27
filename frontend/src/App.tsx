import { RouterProvider, createBrowserRouter } from "react-router-dom";
import AuthorPage from "./components/AuthorPage/AuthorPage";
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
				children: [
					{
						path: ":postId",
						element: <BlogPost />,
					},
				],
			},
			{
				path: "author",
				children: [
					{
						path: ":authorId",
						element: <AuthorPage />,
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
