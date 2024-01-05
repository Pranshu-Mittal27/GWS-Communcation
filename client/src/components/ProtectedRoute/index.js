import { useLocation, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { AuthConsumer } from "../../hooks";

const ProtectedRoute = ({ children, roles }) => {
	const { isLoggedIn, loading, userData } = AuthConsumer();
	// eslint-disable-next-line no-unused-vars
	const location = useLocation();

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!isLoggedIn) {
		return <Navigate to="/login" />;
	}

	if (roles && !roles.includes(userData.role)) {
		return <Navigate to="/unauthorized" />;
	}

	return children;
};

ProtectedRoute.propTypes = {
	children: PropTypes.element,
	roles: PropTypes.array
};

export default ProtectedRoute;
