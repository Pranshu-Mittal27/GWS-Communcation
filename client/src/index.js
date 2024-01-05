// eslint-disable-next-line no-unused-vars
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";
import "./vendor.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "font-awesome/css/font-awesome.min.css";
import { AuthProvider, ModalProvider, FilterProvider } from "./hooks";
import { Loader } from "./components";
import { FetchProvider } from "./helpers";

const root = createRoot(document.getElementById("root"));
root.render(
	// <StrictMode>
	<Suspense
		fallback={<Loader />}
	>
		<FetchProvider>
			<AuthProvider>
				<FilterProvider>
					<ModalProvider>
						<App />
					</ModalProvider>
				</FilterProvider>
			</AuthProvider>
		</FetchProvider>
	</Suspense>
	// </StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
