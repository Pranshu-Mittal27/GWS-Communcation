import PropTypes from "prop-types";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Container, MobileStepper, Button } from "@mui/material";
import { ArrowForwardIos, ArrowBackIos } from "@mui/icons-material";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import Step6 from "./Step6";
import Loader from "../Loader";
import axios from "axios";
import { config } from "../../config";
import { AuthConsumer } from "../../hooks";
import { getDomainFromEmail } from "../../helpers";

const StepperForm = ({ setTitle, setAddDomain }) => {
	const [activeStep, setActiveStep] = useState(0);
	const [adminEmail, setAdminEmail] = useState("");
	const [domain, setDomain] = useState("");
	const [isSubmiting, setIsSubmiting] = useState(false);
	const [loader, setLoader] = useState(false);
	const [isVerified, setIsVerified] = useState(false);

	const { userData } = AuthConsumer();

	const adminCallback = payload => {
		setAdminEmail(payload);
	};
	useEffect(() => {
		setDomain(getDomainFromEmail(adminEmail));
	}, [adminEmail]);

	const domainCallback = payload => {
		setDomain(payload);
	};

	const verifyCallback = useCallback(async () => {
		console.log("here now");
		if (adminEmail === "" || activeStep !== 4 || domain === "") {
			// console.log("inside return");
			return;
		}
		setLoader(true);
		let response = [];
		try {
			response = await axios.post(config.urls.domains.verifyDomain(adminEmail, domain));
			const bucketResponse = await axios.post(config.urls.domains.verifyBucket(adminEmail, domain));
			if (response.status === 200 && bucketResponse.status === 200) {
				// eslint-disable-next-line no-constant-condition
				// if (true) {
				// setAddDomain(false);
				setIsVerified(true);
			}
			setLoader(false);
		} catch (e) {
			console.log("error: ", e);
			setLoader(false);
		}
	}, [activeStep, adminEmail, domain]);

	const steps = useMemo(() => {
		return [
			{
				label: "Admin console",
				elem: <Step1 />
			},
			{
				label: "Client ID setup",
				elem: <Step2 />
			},
			{
				label: "Scopes setup",
				elem: <Step3 />
			},
			{
				label: "Cloud Storage Permission setup",
				elem: <Step4 />
			},
			{
				label: "Admin details",
				elem: <Step5 adminCallback={adminCallback} verifyCallback={verifyCallback} isVerified={isVerified} adminEmail={adminEmail} domainCallback={domainCallback} domain={domain} />
			},
			{
				label: "Success",
				elem: <Step6 />
			}
		];
	}, [verifyCallback, isVerified, adminEmail, domain]);

	useEffect(() => {
		setTitle(steps[activeStep].label);
	}, [activeStep, steps, setTitle]);

	const handleNext = () => {
		if (activeStep < (steps.length - 1)) {
			setActiveStep((prevActiveStep) => prevActiveStep + 1);
		};
		setIsVerified(false);
		// setAdminEmail("");
	};

	const handleSubmit = useCallback(async () => {
		if (adminEmail === "" || activeStep !== 4) {
			return;
		}
		setLoader(true);
		let response = [];
		setIsSubmiting(true);
		try {
			response = await axios.post(config.urls.domains.addDomain(domain, adminEmail, userData?.email));
			setLoader(false);
			if (response.status === 200) {
				setActiveStep((prevActiveStep) => {
					if (prevActiveStep < steps.length - 1) {
						return prevActiveStep + 1;
					}
				});
			}
		} catch (e) {
			setLoader(false);
		}
		setIsSubmiting(false);
		setIsVerified(false);
	}, [adminEmail, activeStep, domain, userData?.email, steps.length]);

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
		setIsVerified(false);
		setAdminEmail("");
	};

	return (
		<>
			{loader && <Loader />}
			<Container style={{ padding: "0", margin: "0", minWidth: "100%", textAlign: "start", display: "flex", flexDirection: "column", justifyContent: "space-between", alignContent: "space-between" }}>
				{steps[activeStep].elem}
				<div style={{ display: "flex", justifyContent: "center", padding: "0.5rem 0" }}>
					<MobileStepper
						variant="progress"
						steps={6}
						position="static"
						activeStep={activeStep}
						sx={{ maxWidth: 700, flexGrow: 1, gap: "1rem" }}
						nextButton={
							<Button
								disabled={(activeStep === steps.length - 1) || ((activeStep === 4) && !isVerified) || isSubmiting || ((activeStep === 4) && (adminEmail === ""))}
								onClick={activeStep === 4 ? handleSubmit : handleNext}
								fullWidth={false}
								className="nextBtn"
								disableRipple={true}
								disableFocusRipple={true}
								disableTouchRipple={true}
							>Next<ArrowForwardIos />
							</Button>
						}
						backButton={
							<Button
								disabled={activeStep === 0}
								onClick={handleBack}
								fullWidth={false}
								className="backBtn"
								disableRipple={true}
								disableFocusRipple={true}
								disableTouchRipple={true}
							><ArrowBackIos />Back
							</Button>
						}
					/>
				</div>
			</Container>
		</>
	);
};

StepperForm.propTypes = {
	setTitle: PropTypes.func.isRequired,
	setAddDomain: PropTypes.func.isRequired
};

export default memo(StepperForm);
