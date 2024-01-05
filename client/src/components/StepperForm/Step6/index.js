import { config } from "../../../config";
import Lottie from "lottie-react";
import React from "react";

const Step6 = () => {
	return (
		<div className="step">
			{/* <p>To add a new domain you need to provide following details</p> */}
			<div className="stepLeft">
				<Lottie style={{ height: "24rem" }} animationData={config.referenceImages.domainAdded} loop={true}
					rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
				/>
			</div>

			<div className="stepRight">
				{/* <h3>Successfully added new domain</h3> */}
				<ul className="stepContent">
					<li>Congratulations</li>
					<li>The new domain has been added Successfully</li>
				</ul>
			</div>
		</div>
	);
};

export default Step6;
