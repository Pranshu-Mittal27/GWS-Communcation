import "boxicons/css/boxicons.min.css";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import { useMemo } from "react";
import axios from "axios";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ConfirmationModal, Loader } from "./components";
import { config } from "./config";
import { AuthConsumer, getUserIdToken } from "./hooks";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import notify from "./components/Toast";
import { getAuth, signOut } from "firebase/auth";

// axios interceptors
axios.interceptors.response.use(
	(response) => {
		if (response.data?.message) {
			notify.success(response.data.message);
		}
		return response;
	},
	(error) => {
		if ((error.response.status >= 400) && (error.response.status <= 600)) {
			notify.error(error.response?.data?.message ? error.response?.data?.message : "Something went wrong");
			if (error.response.status === 401) {
				// logout
				const auth = getAuth();
				signOut(auth);
			}
		}
		return Promise.reject(error);
	}
);

axios.interceptors.request.use(
	async (config) => {
		const idToken = await getUserIdToken();
		config.headers.Authorization = idToken;
		return config;
	},
	(error) => {
		console.log("Error: ", error);
		return Promise.reject(error);
	}
);

const App = () => {
	const { checkedIfLoggedIn, isLoggedIn, loading, userData } = AuthConsumer();

	const routes = useMemo(() => {
		return config.routes(isLoggedIn, loading, userData.role);
	}, [isLoggedIn, loading, userData.role]);

	const router = createBrowserRouter(routes);

	return (
		<>
			{!checkedIfLoggedIn || loading ? <Loader /> : null}
			<ConfirmationModal />
			<RouterProvider router={router} />
			<ToastContainer />
		</>
	);
};

export default App;
