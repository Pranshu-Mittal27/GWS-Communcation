import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";

const CustomStyledSwitch = styled(Switch)(({ theme }) => ({
	padding: 8,
	"& .MuiSwitch-track": {
		borderRadius: 22 / 2,
		backgroundColor: "#1976d2",
		opacity: 1,
		"&:before, &:after": {
			content: "\"\"",
			position: "absolute",
			top: "50%",
			transform: "translateY(-50%)",
			width: 16,
			height: 16
		}
		// "&:before": {
		// backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
		// theme.palette.getContrastText(theme.palette.primary.main)
		// )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
		// left: 12
		// },
		// "&:after": {
		// backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
		// theme.palette.getContrastText(theme.palette.primary.main)
		// )}" d="M19,13H5V11H19V13Z" /></svg>')`,
		// right: 12
		// }
	},
	"& .MuiSwitch-thumb": {
		boxShadow: "none",
		width: 16,
		height: 16,
		margin: 2
	},
	"& .MuiSwitch-switchBase": {
		"&.Mui-disabled": {
			"&+.MuiSwitch-track": {
				opacity: 0.38,
				backgroundColor: "#000"
			}
		},
		"&.Mui-checked:not(.Mui-disabled)": {
			// color: "rgb(230, 255, 189)",
			color: "rgb(255, 245, 230)",
			"&+.MuiSwitch-track": {
				opacity: 1,
				// backgroundColor: "green",
				backgroundColor: "rgb(255, 184, 77)",
				"&:before": {
					backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
						theme.palette.getContrastText(theme.palette.primary.main)
					)}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
					left: 12
				}
			}
		},
		"&:not(.Mui-disabled):not(.Mui-checked)": {
			"&+.MuiSwitch-track": {
				"&:after": {
					backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
						theme.palette.getContrastText(theme.palette.primary.main)
					)}" d="M19,13H5V11H19V13Z" /></svg>')`,
					// backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
					// theme.palette.getContrastText(theme.palette.primary.main)
					// )}" d="M 4.7070312 3.2929688 L 3.2929688 4.7070312 L 10.585938 12 L 3.2929688 19.292969 L 4.7070312 20.707031 L 12 13.414062 L 19.292969 20.707031 L 20.707031 19.292969 L 13.414062 12 L 20.707031 4.7070312 L 19.292969 3.2929688 L 12 10.585938 L 4.7070312 3.2929688 z"/></svg>')`,
					right: 12
				}
			}
		},
		"&.Mui-disabled:not(.Mui-checked)": {
			"&+.MuiSwitch-track": {
				"&:after": {
					backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
						theme.palette.getContrastText(theme.palette.primary.main)
					)}" d="M19,13H5V11H19V13Z" /></svg>')`,
					// backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
					// theme.palette.getContrastText(theme.palette.primary.main)
					// )}" d="M 4.7070312 3.2929688 L 3.2929688 4.7070312 L 10.585938 12 L 3.2929688 19.292969 L 4.7070312 20.707031 L 12 13.414062 L 19.292969 20.707031 L 20.707031 19.292969 L 13.414062 12 L 20.707031 4.7070312 L 19.292969 3.2929688 L 12 10.585938 L 4.7070312 3.2929688 z"/></svg>')`,
					right: 12
				}
			}
		}
	},
	"& .MuiSwitch-switchBase.Mui-checked": {
		color: "white",
		opacity: 1
	},
	// "& .MuiSwitch-switchBase.Mui-disabled": {
	// color: "rgb(255, 204, 204)"
	// },
	"& .MuiSwitch-switchBase:not(.Mui-disabled)": {
		color: "rgba(167, 202, 237)"
	}
	// "& .MuiSwitch-switchBase:not(.Mui-checked)": {
	// // Change this
	// color: "rgba(167, 202, 237)"
	// }
}));

const Android12UnSyncSwitch = (props) => {
	return <CustomStyledSwitch {...props} />;
};

export default Android12UnSyncSwitch;
