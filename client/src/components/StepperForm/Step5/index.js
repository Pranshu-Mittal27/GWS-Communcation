import React, { useState } from "react";
import "../style.css";
import PropTypes from "prop-types";
import addDomain from "../../../assets/img/icons/unicons/addDomain.png";
import {
	InputLabel,
	OutlinedInput,
	Button
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { isEmail } from "../../../helpers";

const Step5 = ({ adminCallback, verifyCallback, isVerified, adminEmail, domainCallback, domain }) => {
	const [inputDisabled, setInputDisabled] = useState(true);
	// useEffect(() => {
	// setInputDisabled(!isEmail(adminEmail));
	// }, [adminEmail]);
	return (
		<div className="step">
			{/* <p>To add a new domain you need to provide following details</p> */}
			<div className="stepLeft">
				<img src={addDomain} alt="img" style={{ aspectRatio: "1", objectFit: "fill", width: "22rem" }}/>
			</div>

			<div className="stepRight">
				{/* <h3 className="text-center w-full">Admin details</h3> */}
				<ul className="stepContent">
					<li>To add new domain, you need to have an admin account of the new domain.</li>
					<li>This domain should not be already existing.</li>
					<h4 style={{ paddingTop: "0.5rem" }}>Enter following details</h4>
					<InputLabel sx={{ marginY: "0.5rem" }}>Admin email</InputLabel>
					<OutlinedInput
						autoComplete="off"
						type="email"
						id="adminEmail"
						sx={{ width: "100%", backgroundColor: "white" }}
						placeholder={"user.email@domain.com"}
						onChange={(e) => adminCallback(e.target.value)}
						disabled={isVerified}
					/>

					<InputLabel sx={{ marginY: "0.5rem" }}>Domain Name</InputLabel>
					<OutlinedInput
						autoComplete="off"
						type="text"
						disabled={inputDisabled}
						placeholder={domain === undefined ? "domain.name" : domain}
						// value={getDomainFromEmail(adminEmail)}
						onChange={(e) => domainCallback(e.target.value)}
						sx={{ width: "100%", backgroundColor: "white" }}
					/>
					<div className="flex justify-between">
						<Button
							disabled={!isEmail(adminEmail) || !inputDisabled}
							onClick={() => setInputDisabled(false)}
							// className="verifyBtn"
							sx={{ fontSize: "0.7rem" }}
						>Edit domain name
						</Button>
						{!isVerified
							? <Button
								disabled={!isEmail(adminEmail)}
								onClick={verifyCallback}
								className="verifyBtn"
								sx={{ fontSize: "1rem" }}
							>Verify domain
							</Button>
							: <div style={{ display: "flex" }}><h5 style={{ color: "green" }}>Verified </h5><CheckIcon sx={{ color: "green" }} ></CheckIcon></div>
						}
					</div>
				</ul>

			</div>
		</div>
	);
};

Step5.propTypes = {
	adminCallback: PropTypes.func.isRequired,
	verifyCallback: PropTypes.func.isRequired,
	isVerified: PropTypes.bool.isRequired,
	adminEmail: PropTypes.any.isRequired,
	domainCallback: PropTypes.func.isRequired,
	domain: PropTypes.any
};

export default Step5;
