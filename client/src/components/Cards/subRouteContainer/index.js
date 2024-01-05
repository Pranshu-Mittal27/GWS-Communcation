import { Card } from "@mui/material";
import PropTypes from "prop-types";

const SubRouteContainerCard = ({ children, ...props }) => {
	return (
		<Card
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				p: "1.5rem",
				borderRadius: "1.5rem",
				boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.2)",
				filter: "drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.2))"
			}}
			{...props}
		>
			{children}
		</Card>
	);
};

SubRouteContainerCard.propTypes = {
	children: PropTypes.node
};

export default SubRouteContainerCard;
