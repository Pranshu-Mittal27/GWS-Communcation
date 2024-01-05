import { Box, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import PropTypes from "prop-types";

const DashboardModuleCard = ({ name, description, icon }) => {
	return (
		<Card
			sx={{
				maxHeight: "12em",
				aspectRatio: "1/1",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-evenly",
				alignItems: "center",
				p: 2,
				borderRadius: "1.5rem",
				boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.2)",
				filter: "drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.2))",
				backgroundColor: "#696cff",
				hover: {
					cursor: "grab"
				}
			}}
		>
			<Box sx={{
				width: "100%",
				height: "35%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center"
			}}>
				{icon}
			</Box>
			<Typography variant="h5" color={"white"} align={"center"}>
				{name}
			</Typography>
		</Card>
	);
};

DashboardModuleCard.propTypes = {
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	icon: PropTypes.element.isRequired
};

export default DashboardModuleCard;
