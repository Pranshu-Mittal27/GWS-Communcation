import { config } from "../../../config";

const Step1 = () => {
	return (
		<div className="step">
			{/* <p>To add a new domain you need to provide following details</p> */}
			<div className="stepLeft">
				<img className="zoom" src={config.referenceImages.domainWideDelegation} alt="img" />
			</div>

			<div className="stepRight">
				{/* <h3 className="text-center w-full">Open Admin console</h3> */}
				<ul className="stepContent">
					<li>You need to have an admin account of the new domain</li>
					<li>This admin should have permissions related to Calendar, Admin Directory, Gmail, Contacts</li>
					<li>Open <a href="https://admin.google.com/ac/owl/domainwidedelegation" target="_blank" rel="noreferrer" style={{ color: "hsl(209, 95%, 51%)" }}>domain wide delegation</a> from admin console</li>
					<li>Click on Add new button in API clients</li>
					<li>A popup will be opened</li>
					<li>Go to next step</li>
				</ul>
			</div>
		</div>
	);
};

export default Step1;
