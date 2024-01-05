import { Backdrop, CircularProgress } from "@mui/material";
import { memo } from "react";

const Loader = () => {
	return (
		<Backdrop
			sx={{
				color: "#0064ff",
				zIndex: (theme) => theme.zIndex.drawer + 1
			}}
			open={true}
		>
			<CircularProgress color="inherit" />
		</Backdrop>
	);
};

export default memo(Loader);
