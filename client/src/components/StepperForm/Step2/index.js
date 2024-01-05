import { config } from "../../../config";
import React from "react";
import { Tooltip, tooltipClasses, styled, Typography } from "@mui/material";

const HtmlTooltip = styled(({ className, ...props }) => (
	<Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
	[`& .${tooltipClasses.tooltip}`]: {
		backgroundColor: "#f5f5f9",
		color: "rgba(0, 0, 0, 0.87)",
		border: "1px solid #dadde9",
		maxWidth: "30rem"
	}
}));

const Step2 = () => {
	return (
		<div className="step">
			{/* <p>To add a new domain you need to provide following details</p> */}
			<div className="stepLeft">
				<img className="zoom" src={config.referenceImages.addClientId} alt="img" />
			</div>

			<div className="stepRight">
				{/* <h3 className="text-center w-full">Enable domain wide delegation</h3> */}
				<ul className="stepContent">
					<li>Add a new Client ID popup will be opened</li>
					<li>
						<HtmlTooltip
							title={
								<React.Fragment>
									<Typography color="inherit">Client ID</Typography>
									{config.clientId}
								</React.Fragment>
							}
						>
							<button className="copyToClipboardBtn" onClick={() => { navigator.clipboard.writeText(config.clientId); }} style={{ cursor: "pointer", color: "var(--bs-purple)", padding: "0.5rem", backgroundColor: "hsl(209, 86%, 77%)" }}
							>Copy Client ID <i className="bx bx-copy ml-1"></i>
							</button>
						</HtmlTooltip>
					</li>
					<li>Paste it in the the Client ID input</li>
					<li>Go to next step</li>
				</ul>
			</div>
		</div>
	);
};

export default Step2;
