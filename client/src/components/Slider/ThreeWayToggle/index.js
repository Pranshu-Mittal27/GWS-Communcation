import Slider from "@mui/material/Slider";
import { styled } from "@mui/material/styles";

const PrettoSlider = styled(Slider)({
	color: "#0064ff",
	height: 8,
	"& .MuiSlider-track": {
		border: "none",
		backgroundColor: "#0064ff"
	},
	"& .MuiSlider-thumb": {
		height: 24,
		width: 24,
		backgroundColor: "#fff",
		border: "2px solid currentColor",
		"&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
			boxShadow: "inherit"
		},
		"&:before": {
			display: "none"
		}
	},
	"& .MuiSlider-valueLabel": {
		lineHeight: 1.2,
		fontSize: 12,
		background: "unset",
		padding: 0,
		width: 32,
		height: 32,
		borderRadius: "50% 50% 50% 0",
		backgroundColor: "#0064ff",
		transformOrigin: "bottom left",
		transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
		"&:before": { display: "none" },
		"&.MuiSlider-valueLabelOpen": {
			transform: "translate(50%, -100%) rotate(-45deg) scale(1)"
		},
		"& > *": {
			transform: "rotate(45deg)"
		}
	}
});

const ThreeWayToggleSlider = (props) => {
	return (
		<PrettoSlider
			{...props}
		/>
	);
};

export default ThreeWayToggleSlider;
