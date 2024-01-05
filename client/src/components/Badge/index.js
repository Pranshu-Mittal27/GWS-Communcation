import PropTypes from "prop-types";

const Badge = ({ variant = "primary", content }) => {
	return (
		<span className={`badge bg-label-${variant}`} >
			{ content }
		</span >
	);
};

Badge.propTypes = {
	content: PropTypes.string.isRequired,
	variant: PropTypes.string.isRequired
};

export default Badge;
