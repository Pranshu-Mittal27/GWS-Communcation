import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { EmailList, EmailDetails, EmailTopBar, EmailFilter, Loader } from "../../components";
import axios from "axios";
import { AuthConsumer, ModalConsumer, FilterConsumer } from "../../hooks";
import { config } from "../../config";
import notify from "../../components/Toast";

// style import
import { Box, Grid } from "@mui/material";
import Lottie from "lottie-react";
import searchingGif from "../../assets/img/illustrations/searching.json";

const MailBox = ({ selectedUser, userAction }) => {
	const { userData } = AuthConsumer();
	const { filterValue, setFilterValue } = FilterConsumer();
	const { loader, setLoader } = AuthConsumer();
	const [currentEmailId, setCurrentEmailId] = useState(-1);
	const [emailData, setEmailData] = useState([]);
	const [toDeleteMails, setToDeleteMails] = useState(() => new Set());
	// const [isModalOpen, setIsModalOpen] = useState(false);
	const [pageToken, setPageToken] = useState(undefined);
	const [pageTokenArray, setPageTokenArray] = useState([]);
	const [isFilter, setIsFilter] = useState(false);

	// ToModal State Variable
	const [openCard, setOpenCard] = useState(false);
	const { dispatch: dispatchModal } = ModalConsumer();

	const addDeleteEmail = useCallback((id) => {
		setToDeleteMails(prev => new Set(prev).add(id));
	}, []);

	const removeDeleteEmail = useCallback((id) => {
		setToDeleteMails(prev => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	}, []);

	const openEmail = useCallback((id) => {
		setCurrentEmailId(id);
	}, []);

	const selectedEmail = useMemo(() => {
		setOpenCard(false);
		return emailData?.find((email) => (email?.id === currentEmailId));
	}, [currentEmailId, emailData]);

	const getMyMails = useCallback(async () => {
		setToDeleteMails(() => new Set());
		setLoader(true);
		await axios.post(config.urls.mails.get(), {
			email: !userAction ? userData.email : selectedUser, filters: {}
		}).then((response) => {
			response = response.data;
			setLoader(false);
			console.log("getMails", response);
			setEmailData([...response.messages]);
			setPageTokenArray([response.nextPageToken]);
		})
			.catch((error) => {
				notify.error(error.response?.data?.message ? error.response?.data?.message : "Something went wrong");
				setLoader(false);
				setEmailData([]);
				setPageTokenArray([]);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userData.email, selectedUser, userAction]);

	const retractMail = useCallback(async (mailId) => {
		console.log("mailId", mailId);
		let response = [];
		response = await axios.delete(config.urls.mails.delete(), {
			data: {
				senderMail: !userAction ? userData.email : selectedUser,
				messageId: mailId
			}
		});
		response = response.data;
		console.log(response);
		// setCurrentEmailId(-1);
		// setEmailData(emailData.filter((email) => !(email.id === mailId)));
		// removeDeleteEmail(mailId);
	}, [userAction, userData.email, selectedUser]);

	const deleteAllMails = useCallback(async () => {
		setLoader(true);
		console.log("DeleteAlMails call");
		const promises = [];
		toDeleteMails.forEach((mailId) => {
			const mailIdIndex = emailData.find((email) => {
				return (email.id === mailId);
			});
			if (mailIdIndex !== undefined) {
				promises.push(retractMail(mailId));
			}
		});
		await Promise.allSettled(promises);
		setTimeout(async () => {
			await getMyMails();
			console.log("Setting loader false");
			setLoader(false);
		}, 500);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [emailData, getMyMails, retractMail, toDeleteMails]);

	// diaptch for delete mails
	const deleteModal = (e) => {
		console.log("toDeleteMails: ", toDeleteMails);
		e.preventDefault();
		dispatchModal({
			type: "open",
			payload: {
				title: "Delete Mails",
				content: "This will delete the selected mails from the recipients' inbox. This deletion cannot be reverted back. Do you really want to delete the selected mails?",
				onSuccess: deleteAllMails
			}
		});
	};

	// change Page function
	const changePage = async (token, param) => {
		if (token === undefined && param === "left") {
			token = undefined;
		}
		if (token === undefined && param === "right") {
			return;
		}
		setLoader(true);
		let response = [];

		response = await axios.post(config.urls.mails.get(), {

			email: !userAction ? userData.email : selectedUser, filters: filterValue, nextPageToken: token
		});
		response = response.data;

		setEmailData([...response.messages]);
		if (param === "right") {
			setPageTokenArray([...pageTokenArray, response.nextPageToken]);
		} else {
			setPageTokenArray((pageTokenArray) => (pageTokenArray.slice(0, -1)));
		}
		setLoader(false);
	};

	// When user change or getMyMails called, this useEffect run
	useEffect(() => {
		setFilterValue({
			// fromEmail: data.email,
			toEmail: "",
			subject: "",
			hasWords: "",
			doesntHave: "",
			date1: "",
			date2: "",
			attachment: false
		});
		setPageTokenArray([]);
		getMyMails();
		setOpenCard(false);
		return () => {
			return false;
		};
	}, [getMyMails, selectedUser, setFilterValue]);

	// Toggle Filter
	const toggleFilter = (value) => {
		setIsFilter(!value);
	};

	return (

		<Box className="h-full">
			{!userAction
				? <h1 className="w-fit pt-3 pb-3 px-5 pageTitle bg-blue-500 text-white">Mail Recall</h1>
				: <div className="flex items-center justify-between py-6">
					<h1>Mail Recall</h1>
				</div>
			}
			<Grid container spacing={0.9} padding={!userAction ? 1.5 : 0} marginTop={0} >
				{/* Email List */}
				<Grid item xs={userAction ? 12 : 4} >
					<EmailTopBar
						deleteAllMails={deleteModal}
						isFilter={isFilter}
						toggleFilter={toggleFilter}
						nextPageToken={pageToken}
						setPageToken={setPageToken}
						changePage={changePage}
						pageTokenArray={pageTokenArray}
						emailCount={emailData}
						refreshMails={getMyMails}
						toDeleteMails={Array.from(toDeleteMails)}
						userAction={userAction}
						loader={loader}
					/>
					{
						isFilter
							? (loader
								? <Box
									sx={{
										backgroundColor: "#fff",
										padding: "1.2rem",
										height: userAction ? "65vh" : "75vh",
										// height: "80vh",
										overflowX: "hidden",
										overflowY: "auto"
									}}
								>
									<Box sx={{ display: "flex", alignContent: "center", justifyContent: "center" }}>
										<div className="flex justify-center items-center">
											<Lottie style={{ height: 250 }} animationData={searchingGif} loop={true} rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} />
										</div>

									</Box>
								</Box>
								: <EmailFilter
									data={{ role: userData.role, email: !userAction ? userData.email : selectedUser }}
									setEmailData={setEmailData}
									setPageToken={setPageToken}
									isFilter={isFilter}
									toggleFilter={toggleFilter}
									// filterValue={filterValue}
									// setFilterValue={setFilterValue}
									setPageTokenArray={setPageTokenArray}
									userAction={userAction}
								/>)
							: (!loader
								? <EmailList
									emails={emailData}
									getSelectedEmail={openEmail}
									selectedEmail={selectedEmail}
									addDeleteEmail={addDeleteEmail}
									removeDeleteEmail={removeDeleteEmail}
									userAction={userAction}
								/>

								: <>
									<Box
										sx={{
											backgroundColor: "#fff",
											padding: "1.2rem",
											height: userAction ? "61.5vh" : "75vh",
											overflowX: "hidden",
											overflowY: "auto"
										}}
									>
										<Box sx={{ display: "flex", alignContent: "center", justifyContent: "center", paddingTop: "25%" }}>
											<div className="flex justify-center items-center">
												<Lottie style={{ height: 250 }} animationData={searchingGif} loop={true} rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} />
											</div>

										</Box>
									</Box>
									<Loader />
								</>
							)

					}

				</Grid>

				{/* Email Details */}
				{!userAction && <Grid item xs={userAction ? 7 : 8} paddingY="1rem">
					<EmailDetails email={selectedEmail} userAction={userAction} openCard={openCard} toggleCard={setOpenCard} />
				</Grid>}

			</Grid>

		</Box>
	);
};

MailBox.propTypes = {
	selectedUser: PropTypes.string,
	userAction: PropTypes.bool.isRequired
};

export default MailBox;
