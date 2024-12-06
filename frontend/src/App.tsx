import { RouterProvider, createBrowserRouter } from "react-router-dom";
import AuthorPage from "./components/AuthorPage/AuthorPage";
import BlogPost from "./components/BlogPost/BlogPost";
import EditPost from "./components/EditPost";
import HomePage from "./components/HomePage/HomePage";
import Layout from "./components/Layout/Layout";
import NewPost from "./components/NewPost/NewPost";
import Following from "./components/Following";

const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{
				path: "following",
				element: <Following />,
			},
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
					{
						path: ":postId/edit",
						element: <EditPost />,
					},
					{
						path: "new",
						element: <NewPost />,
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
