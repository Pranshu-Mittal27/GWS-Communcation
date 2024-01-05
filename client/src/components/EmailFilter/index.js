/* eslint-disable no-unused-vars */
import PropTypes from "prop-types";
import { memo, useState } from "react";
import {
	Button,
	Grid,
	TextField,
	Typography,
	Box,
	Checkbox,
	createTheme,
	ThemeProvider
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { config } from "../../config";
import { AuthConsumer, FilterConsumer } from "../../hooks";
import axios from "axios";

const EmailFilter = ({ data, setEmailData, toggleFilter, setPageTokenArray, userAction }) => {
	const { filterValue, setFilterValue } = FilterConsumer();
	const [fromEmail, setFromEmail] = useState(data.email);
	const [toEmail, setToEmail] = useState(filterValue.toEmail);
	const [subject, setSubject] = useState(filterValue.subject);
	const [hasWords, setHasWords] = useState(filterValue.hasWords);
	const [doesntHave, setDoesntHave] = useState(filterValue.doesntHave);
	const [date1, setDate1] = useState(filterValue.date1);
	const [date2, setDate2] = useState(filterValue.date2);
	// const [search, setSearch] = useState();
	const [attachment, setAttachment] = useState(filterValue.attachment);
	const { setLoader } = AuthConsumer();

	const onFilter = async () => {
		const filterObjectState = {
			// fromEmail,
			toEmail,
			subject,
			hasWords,
			doesntHave,
			date1,
			date2,
			attachment
		};
		// setFilterValue(filterObjectState);
		setFilterValue(filterObjectState);
		const body = {
			email: fromEmail,
			filters: {
				from: fromEmail,
				to: toEmail,
				subject,
				omitWords: doesntHave,
				hasWords,
				attachment,
				before: date2,
				after: date1
			}
		};

		let response = [];
		setLoader(true);
		response = await axios.post(config.urls.mails.get(), body);
		response = response.data;
		setEmailData([...response.messages]);
		setPageTokenArray([response.nextPageToken]);
		toggleFilter(true);
		setLoader(false);
	};

	const onClear = () => {
		// setFromEmail();
		setToEmail("");
		setSubject("");
		setHasWords("");
		setDoesntHave("");
		setAttachment(false);
		console.log("After clear");
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
	};

	const theme = createTheme({
		typography: {
			fontSize: 13
		},
		textField: {
			fontSize: 14
		},
		button: {
			textTransform: "lowercase"
		}
	});

	return (
		<ThemeProvider theme={theme}>
			<Box
				className="mx-auto"
				sx={{
					background: "#fff",
					backdropFilter: "blur(17.1px)",
					webkitBackdropFilter: "blur(17.1px)",
					border: "1px solid rgba(255, 255, 255, 1)",
					overflow: "hidden",
					height: userAction ? "61.5vh" : "75vh",
					width: "100%"
				}}
			>
				<Grid container spacing={1} >
					<Grid item xs={12}>
						<Box
							sx={{
								margin: "1rem",
								marginTop: "1.5rem"
								// borderRadius: "1.5rem",
							}}
						>
							<Grid container columnSpacing={3} rowSpacing={2} columns={18}>
								<Grid item xs={5} sx={{ mt: "0.3rem" }}>
									<Typography >
										From
									</Typography>
								</Grid>
								<Grid item xs={13}>
									<TextField
										value={fromEmail}
										variant="standard"
										fullWidth
										fontSize
										// disabled={data.role === "user" ? true : false}
										disabled
										onChange={(e) => setFromEmail(e.target.value)}
									/>
								</Grid>
								<Grid item xs={5} sx={{ mt: "0.3rem" }}>
									<Typography >
										To
									</Typography>
								</Grid>
								<Grid item xs={13}>
									<TextField
										value={toEmail}
										variant="standard"
										fullWidth
										onChange={(e) => setToEmail(e.target.value)}
									/>
								</Grid>
								<Grid item xs={5} sx={{ mt: "0.3rem" }}>
									<Typography >
										Subject
									</Typography>
								</Grid>
								<Grid item xs={13}>
									<TextField
										value={subject}
										variant="standard"
										fullWidth
										onChange={(e) => setSubject(e.target.value)}
									/>
								</Grid>
								<Grid item xs={5} sx={{ mt: "0.3rem" }}>
									<Typography >
										Has the words
									</Typography>
								</Grid>
								<Grid item xs={13}>
									<TextField
										value={hasWords}
										variant="standard"
										fullWidth
										onChange={(e) => setHasWords(e.target.value)}
									/>
								</Grid>
								<Grid item xs={5} sx={{ mt: "0.3rem" }}>
									<Typography >
										Doesn&apos;t have
									</Typography>
								</Grid>
								<Grid item xs={13}>
									<TextField

										value={doesntHave}
										variant="standard"
										fullWidth
										onChange={(e) => setDoesntHave(e.target.value)}
									/>
								</Grid>
								{/* <Grid item xs={5}>
								<Typography  sx={{ mt: "0.3rem" }} >
                                    Date Within
								</Typography>
							</Grid>

							<Grid item xs={5}>

							</Grid>
							<Grid item xs={5}>

							</Grid> */}

								<Grid item xs={5} sx={{ mt: "0.3rem" }}>
									<Typography >
										Search
									</Typography>
								</Grid>
								<Grid item xs={13}>
									<TextField
										id="outlined-password-input"
										variant="standard"
										fullWidth
										disabled
										value={"is:Sent"}
									>
									</TextField>
								</Grid>

								<Grid item xs={5} sx={{ mt: "0.3rem" }}>
									<Typography >
										Attachment
									</Typography>
								</Grid>
								<Grid item xs={13}>
									<Checkbox checked={attachment} onChange={(e) => setAttachment(!attachment)} size="small" />

								</Grid>

							</Grid>
						</Box>
					</Grid>

				</Grid>
				{/* Buttons */}
				<Grid
					sx={{ display: "flex", justifyContent: "center", mt: "1rem" }}
					item
					xs={12}
					md={12}
				>
					<Button sentenceCase

						variant="contained"
						size="small"
						sx={{
							backgroundColor: "#0064ff",
							color: "#fff",
							borderRadius: "0.3rem",
							mr: "3rem",
							mb: "1rem",
							padding: "0.4rem",
							"&:hover": {
								backgroundColor: "#0064ff"
							},
							textTransform: "capitalize",
							fontSize: 14
						}}
						onClick={() => {
							onClear();
						}}
					>
						Clear
					</Button>
					<Button

						variant="contained"
						sx={{
							backgroundColor: "#0064ff",
							color: "#fff",
							borderRadius: "0.3rem",
							mr: "1rem",
							mb: "1rem",
							"&:hover": {
								backgroundColor: "#0064ff"
							},
							textTransform: "capitalize",
							fontSize: 14
						}}
						onClick={() => {
							onFilter();
						}}
					>
						Filter
					</Button>
				</Grid>
			</Box>
		</ThemeProvider>

	);
};

EmailFilter.propTypes = {
	data: PropTypes.object.isRequired,
	setEmailData: PropTypes.func.isRequired,
	toggleFilter: PropTypes.func.isRequired,
	setPageTokenArray: PropTypes.func.isRequired,
	userAction: PropTypes.bool.isRequired
};

export default memo(EmailFilter);
