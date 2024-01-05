/* eslint-disable no-tabs */
import { styled } from "@mui/material/styles";
import { Box, Card, Typography } from "@mui/material";
import PropTypes from "prop-types";

const GradientCard = styled(Card,
	{
		shouldForwardProp: (prop) => prop !== "gradientColor"
	}
)(({ theme, gradientColor, height, width }) => ({
	position: "relative",
	padding: theme.spacing(0.5, 0.75),
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
	// background: `linear-gradient(to right, ${gradientColor[0]}, ${gradientColor[1]})`,
	backgroundColor: theme.palette.background.default,
	height: `${height}px`,
	width: `${width}px`,
	boxShadow: "1px 1px 1px 3px" + theme.palette.background.secondary,
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	border: "none"
}));

const Amount = styled(Typography)(({ theme }) => ({
	position: "relative",
	zIndex: 10,
	color: "inherit",
	fontSize: "26px",
	fontWeight: 500,
	lineHeight: "1.2"
}));

const Label = styled(Typography)(({ theme }) => ({
	position: "relative",
	zIndex: 10,
	color: theme.palette.text.secondary,
	fontWeight: 600,
	fontSize: "13px"
}));

const Row = styled("div")({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	paddingLeft: "0.5rem"
});

const Column = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	justifyContent: "center"
});

const IconContainer = styled("div")(({ theme }) => ({
	position: "relative",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
	width: "10%"
}));

const DashboardCard = ({ amount, label, icon, gradientColor, height = 75, width = 250 }) => {
	return (
		<GradientCard variant={"outlined"} gradientColor={gradientColor} height={height} width={width}>
			<Box sx={{
				p: 1.5,
				width: "100%"
			}}>
				<Row>
					<Column>
						<Amount>{amount}</Amount>
						<Label>{label}</Label>
					</Column>
					<IconContainer><img src={icon} alt={label}/></IconContainer>
				</Row>
			</Box>
		</GradientCard>
	);
};

DashboardCard.propTypes = {
	amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	label: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
	gradientColor: PropTypes.array.isRequired,
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default DashboardCard;
