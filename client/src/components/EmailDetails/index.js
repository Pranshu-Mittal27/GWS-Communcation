import { memo } from "react";
import PropTypes from "prop-types";
import parse from "html-react-parser";

// style import
import { Box, Typography, Avatar, Divider, IconButton, Card, Stack } from "@mui/material";
import { prettyDate, splitSeconds, getListOfEmailFromTo, getListOfNameFromTo, truncateString } from "../../helpers";
import Lottie from "lottie-react";
import emptyTableGif from "../../assets/img/illustrations/empty-table.json";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EmailAttchment from "../EmailAttachment";
// import OutsideClickHandler from "react-outside-click-handler";

import "./index.css";

const EmailDetails = ({ email = undefined, userAction, openCard, toggleCard }) => {
	console.log("to", getListOfEmailFromTo(email?.To));

	return (
		<Box sx={{ backgroundColor: "#fff", padding: "1.2rem", height: userAction ? "67vh" : "80.6vh", overflow: "scroll" }}>
			{email === undefined
				? (
					<div className="flex items-center justify-center w-full h-full">
						<Lottie style={{ height: "35rem" }} animationData={emptyTableGif} loop={true}
							rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
						/>
					</div>
				)
				: (
					<Box sx={{ overflowY: "auto", height: "100%", paddingTop: "0" }}>
						{/* Subject */}
						<Box>
							<Typography variant="h5" >{email.Subject}</Typography>
						</Box>

						{/* Avatar,Email and Date */}
						<Box sx={{ display: "flex", justifyContent: "space-between", mt: "0.5rem" }}>

							<Box sx={{ display: "flex", justifyContent: "left" }}>
								<Avatar src="/broken-image.jpg" />
								<Box sx={{ display: "flex", justifyContent: "flex-start", flexDirection: "column", rowGap: "0rem", columnGap: "0rem" }}>
									<Typography variant="body4" sx={{ ml: "0.4rem" }}>{email.From}</Typography>
									<Box component={"span"} sx={{ mt: "0" }}>
										<Typography variant="body4" sx={{ ml: "0.4rem" }} >To: {userAction ? truncateString(getListOfNameFromTo(email.To), 60) : truncateString(getListOfNameFromTo(email.To), 100)}</Typography>

										<IconButton sx={{ padding: "0" }} onClick={() => toggleCard(!openCard)} >
											<ArrowDropDownIcon sx={{ fontSize: "1.5rem", minHeight: 0, minWidth: 0, padding: 0 }} />
										</IconButton>

									</Box>
								</Box>

							</Box>
							<Box sx={{ mr: "1rem", display: "flex", justifyContent: "flex-start", flexDirection: "column" }}>
								<Typography variant="body4" >{prettyDate(email.Date)}</Typography>
								<Typography variant="body4" >{splitSeconds(email.Date)}</Typography>
							</Box>
						</Box>

						{/* Description , Attachment, To Comonent */}
						<Box sx={{ width: "100%", padding: "1rem" }}>

							<Box
								// sx={{ height: userAction ? "50vh" : "63vh", display: "grid" }}
							>

								{/* Card To component */}
								{openCard &&
									// <OutsideClickHandler onOutsideClick={() => toggleCard(false)}>
									<Box sx={{ gridArea: "1/1", zIndex: 100000 }}>
										<Card sx={{ width: userAction ? "70%" : "50%", maxHeight: "15rem", padding: "0.7rem", border: "0.04rem solid black", overflow: "scroll", borderRadius: "0" }}>
											<Box sx={{ display: "flex", columnGap: 1 }}>
												<Typography sx={{ fontSize: "0.9rem", fontWeight: "bold" }}>From:</Typography>
												<Typography sx={{ fontSize: "0.9rem" }}>{email.From}</Typography>
											</Box>
											<Stack direction="row" spacing={1}>
												<Typography sx={{ fontSize: "0.9rem", fontWeight: "bold", ml: "1.2rem" }}>To:</Typography>
												<Box>
													{
														getListOfEmailFromTo(email?.To).map((emailName, index, arr) => {
															return (
																<Typography sx={{ fontSize: "0.9rem" }} key={index}>{emailName}{arr.length - 1 === index ? "" : ","}</Typography>
															);
														})
													}
												</Box>
											</Stack>
										</Card>
									</Box>
									// </OutsideClickHandler>
								}
								<Box sx={{ gridArea: "1/1", width: "100%" }}>
									{/* Description */}
									<Typography sx={{ fontSize: "0.8rem", whiteSpace: "pre-line", width: "100%" }}>
										{
											parse(email.body.replace(/\n(?!\s)/g, "").replace(/\n(?!\s\n)/g, "\n\n"))
										}
									</Typography>

									{/* Attachment */}
									{
										(email.attachments.length !== 0) &&
										<>
											<Divider sx={{ mb: "1rem" }} />
											<Typography sx={{ pl: "0.2rem" }}>{email?.attachments.length} {email?.attachments.length === 1 ? "Attachment" : "Attachments"}</Typography>
										</>

									}
									<Box sx={{ display: "flex", paddingTop: "1rem", justifyContent: "flex-start", flexWrap: "wrap", columnGap: "1rem", rowGap: "1rem" }}>
										{
											email?.attachments?.map((fileName, index) => {
												return (
													<EmailAttchment fileName={fileName} key={index} sx={{}} />
												);
											})
										}

									</Box>
								</Box>
							</Box>

						</Box>
					</Box >
				)

			}

		</Box >
	);
};

EmailDetails.propTypes = {
	email: PropTypes.object,
	userAction: PropTypes.bool.isRequired,
	openCard: PropTypes.bool.isRequired,
	toggleCard: PropTypes.func.isRequired
};

export default memo(EmailDetails);
