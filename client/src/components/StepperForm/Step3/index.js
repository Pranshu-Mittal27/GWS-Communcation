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

const Step3 = () => {
	return (
		<div className="step">
			{/* <p>To add a new domain you need to provide following details</p> */}
			<div className="stepLeft">
				<img className="zoom" src={config.referenceImages.addScopes} alt="img" />
			</div>

			<div className="stepRight">
				{/* <h3 className="text-center w-full">Enable domain wide delegation</h3> */}
				<ul className="stepContent">
					<li>Copy all the OAuth scopes in the popup</li>
					<li>
						<HtmlTooltip
							title={
								<React.Fragment>
									<Typography color="inherit">Scopes</Typography>
									<ul style={{ fontSize: "0.8rem", lineHeight: "1.8em" }}>
										{config.scopes.map((scope, key) =>
											<li key={key}>
												{scope}
											</li>
										)
										}
									</ul>
								</React.Fragment>
							}
						>
							<button className="copyToClipboardBtn" onClick={() => { navigator.clipboard.writeText(config.scopes); }} style={{ cursor: "pointer", color: "var(--bs-purple)", padding: "0.5rem", backgroundColor: "hsl(209, 86%, 77%)" }}
							>Copy scopes <i className="bx bx-copy ml-1"></i>
							</button>
						</HtmlTooltip>
					</li>
					<li>Paste it in the the OAuth scopes input</li>
					<li>and then click on Authorize</li>
					<li>Go to next step</li>
				</ul>
			</div>
		</div>
	);
};

export default Step3;
