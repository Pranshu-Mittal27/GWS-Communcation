import PropTypes from "prop-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function FetchProvider ({ children }) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

FetchProvider.propTypes = {
	children: PropTypes.element.isRequired
};
