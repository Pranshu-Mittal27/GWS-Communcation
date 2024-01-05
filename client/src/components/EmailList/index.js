import PropTypes from "prop-types";
import { memo } from "react";
import EmailListItem from "./Item";
import Lottie from "lottie-react";
// import searchingGif from "../../assets/img/illustrations/searching.json";
import notFoundGif from "../../assets/img/illustrations/no-results-found.json";

// style import
import { Box } from "@mui/material";

const EmailList = ({ emails, getSelectedEmail, selectedEmail, addDeleteEmail, removeDeleteEmail, userAction }) => {
	return (
		<Box
			sx={{
				backgroundColor: "#fff",
				padding: "1.2rem",
				height: userAction ? "61.5vh" : "75vh",
				overflowX: "hidden",
				overflowY: "auto"
			}}
		>
			{(emails?.length === 0
				? <Box sx={{ display: "flex", alignContent: "center", justifyContent: "center", paddingTop: "30%" }}>
					<div className="flex justify-center items-center">
						<Lottie style={{ height: 250 }} animationData={notFoundGif} loop={true} rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} />
					</div>

				</Box>
				: (<Box>
					{
						emails?.map((email, i) => {
							return (
								<EmailListItem key={email?.id} email={email} openEmail={getSelectedEmail} selected={selectedEmail?.id === email?.id} addDeleteEmail={addDeleteEmail} removeDeleteEmail={removeDeleteEmail} userAction={userAction} sx={{ mt: "0" }} />
							);
						})
					}
				</Box >)
			)

			}

		</Box >

	);
};

EmailList.propTypes = {
	emails: PropTypes.array.isRequired,
	getSelectedEmail: PropTypes.func.isRequired,
	selectedEmail: PropTypes.object,
	addDeleteEmail: PropTypes.func.isRequired,
	removeDeleteEmail: PropTypes.func.isRequired,
	userAction: PropTypes.bool.isRequired
};

export default memo(EmailList);
