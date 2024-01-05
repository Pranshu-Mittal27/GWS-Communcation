/* eslint-disable no-unused-vars */
import { config } from "../../../config";
import React from "react";

const Step4 = () => {
	return (
		<div className="step">
			{/* <p>To add a new domain you need to provide following details</p> */}
			<div className="stepLeft">
				<img className="zoom" src={config.referenceImages.cloudStorage} alt="img" />
			</div>

			<div className="stepRight">
				{/* <h3 className="text-center w-full">Enable domain wide delegation</h3> */}
				<ul className="stepContent">
					<li>In the Google Cloud console &gt; IAM page &gt;  <a href="https://console.cloud.google.com/iam-admin/iam" target="_blank" rel="noreferrer" style={{ color: "hsl(209, 95%, 51%)" }}>IAM</a></li>
					<li>Select the project</li>
					<li>Click GRANT ACCESS</li>
					<li>In the Add principals field, enter admin email id</li>
					<li>In the Select a role list, select Storage Object Admin role</li>
					<li>Click Save</li>
				</ul>
			</div>
		</div>
	);
};

export default Step4;
