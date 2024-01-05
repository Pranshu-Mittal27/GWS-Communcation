/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import { BasicCard, ContentHeader, Loader, RoleCard, SearchBar } from "../../components";
import { Box, Button, Container, Grid, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { config } from "../../config";
import Lottie from "lottie-react";
import { useSearch, ModalConsumer } from "../../hooks";
import axios from "axios";
import notify from "../../components/Toast";
import BackupTable from "../../components/Table/BackupTable";
import ErrorTable from "../../components/Table/ErrorTable";

import searchingGif from "../../assets/img/illustrations/searching.json";
import noResultsGif from "../../assets/img/illustrations/no-results-found.json";
import emptyTableGif from "../../assets/img/illustrations/empty-table.json";
import CheckCard from "../../components/Cards/CheckCard";
import BulkBackupForm from "../../components/BulkUploadForm";
import { DashboardCard } from "../../components/Cards";
import completedBackup from "../../assets/img/icons/unicons/completedBackup.png";
import inProgressBackup from "../../assets/img/icons/unicons/inProgressBackup.png";
import yetToStartBackup from "../../assets/img/icons/unicons/yetToStartBackup.png";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { green, red } from "@mui/material/colors";

const useSelectedUser = () => {
	const [selectedUser, setSelectedUser] = useState(undefined);

	return {
		selectedUser,
		setSelectedUser
	};
};

const LeftUserBackup = () => {
	const [requestBackup, setRequestBackup] = useState({});
	const [finalServiceParams, setFinalServiceParams] = useState([]);
	const [matterStatus, setMatterStatus] = useState();
	const [loading, setLoading] = useState(false);
	const { dispatch: dispatchModal } = ModalConsumer();
	const [dashboardData, setDashboardData] = useState();
	const [deleteModal, showDeleteModal] = useState(false);
	const [bulkRequestBackup, setBulkRequestBackup] = useState([]);
	const [isErrorLog, setIfErrorLog] = useState(false);

	// const tableData = {
	// 	name: ["abc", "xyz"],
	// 	description: ["abc", "abnk"],
	// 	mailStatus: ["abc", "abnk"],
	// 	contactStatus: ["abc", "abnk"]
	// };

	const fetchDashboardStats = async (type) => {
		let response = {};
		if (type === "dashboard") {
			console.log("inside dashboard");
			response = await axios({
				method: "post",
				url: config.urls.backup.dashboard()
			});
		} else {
			response = await axios({
				method: "post",
				url: config.urls.backup.errorDashboard()
			});
		}
		// const data = config.endpoints.getDashboardStats.responseHandler(response);
		// const a = Object.keys(response.data).map((o) => { return { ...response.data[o], type: o }; });
		// console.log("a: ", a);
		return response.data;
	};

	const loadTableData = useCallback(async () => {
		// const { rangeStart, rangeEnd } = getRangeStartEndInUnix(startDate, endDate);
		const data = await fetchDashboardStats("dashboard");
		return data.all;
	}, []);

	const loadErrorTableData = useCallback(async () => {
		// const { rangeStart, rangeEnd } = getRangeStartEndInUnix(startDate, endDate);
		const data = await fetchDashboardStats("error log");
		return data.all;
	}, []);

	const { query, setQuery, results, isSearching } = useSearch({
		fetchFunction: useCallback(async (query) => {
			let response = await axios.get(config.urls.users.getSuspendedUsers(query));
			if (response.status === 404) {
				return Promise.resolve([]);
			}
			response = response.data;
			return Promise.resolve(response);
		}, []),
		searchDelay: 500
	});

	useEffect(() => {
		console.log("inside dashboard effect");
		const fetchDashboardData = async () => {
			setLoading(true);
			const response = await axios.post(config.urls.backup.dashboard());
			console.log("resData: ", response.data);
			setDashboardData(response.data);
			setLoading(false);
		};
		fetchDashboardData();
	}, []);

	const { selectedUser, setSelectedUser } = useSelectedUser();

	// Get matter status of the selected user
	// const getMatterStatus = async () => {
	// let response = await axios.post(config.urls.backup.getMatterStatus(), { accountEmail: selectedUser?.primaryEmail });
	// if (response.status === 404) {
	// return Promise.resolve([]);
	// }
	// response = response.data;
	// setMatterStatus(response);
	// console.log("getMatterStatus: ", response);
	// };

	const getMatterStatus = useCallback(
		async () => {
			setLoading(true);
			let response = await axios.post(config.urls.backup.getMatterStatus(), { accountEmail: selectedUser?.primaryEmail || selectedUser?.email });
			if (response.status === 404) {
				return Promise.resolve([]);
			}
			response = response.data;
			setMatterStatus(response);
			console.log("getMatterStatus: ", response);
			setLoading(false);
		},
		[selectedUser?.primaryEmail || selectedUser?.email]
	);

	useEffect(() => {
		setRequestBackup({
			accountEmail: selectedUser?.primaryEmail || selectedUser?.email,
			services: {
				drive: false,
				gmail: false,
				chat: false,
				groups: false
			}
		});
		// if (selectedUser !== undefined) {
		// 	getMatterStatus();
		// }
	}, [selectedUser]);

	useEffect(() => {
		setFinalServiceParams([
			{
				name: "gmail",
				startDate: "",
				endDate: "",
				includeDraft: false,
				onlySentMail: false
			},
			{
				name: "drive",
				startDate: "",
				endDate: "",
				includeSharedDrive: false
			},
			{
				name: "groups",
				startDate: "",
				endDate: "",
				includeDraft: false,
				onlySentMail: false
			},
			{
				name: "chat",
				startDate: "",
				endDate: "",
				includChatSpace: false
			}
		]
		);
		// if (selectedUser !== undefined) {
		// 	getMatterStatus();
		// }
	}, [selectedUser]);

	console.log("request backup : ", requestBackup);

	useEffect(() => {
		if (selectedUser !== undefined) {
			getMatterStatus();
		}
		// if (selectedUser === undefined) {
		// 	console.log("not selected a user");
		// } else {
		// 	console.log("selected a user");
		// }
	}, [getMatterStatus, selectedUser]);

	// enable/disable checked/unchecked backup options
	const selectedBackupOptions = (e) => {
		const { name, checked } = e.target;
		console.log("e.target.checked : " + checked);
		if (checked === false) {
			setRequestBackup({
				...requestBackup,
				services: {
					...requestBackup.services,
					[name]: checked
				}
			});
		} else {
			for (let i = 0; i < finalServiceParams.length; i++) {
				if (name === finalServiceParams[i].name) {
					console.log("inside else condition");
					setRequestBackup({
						...requestBackup,
						services: {
							...requestBackup.services,
							[name]: finalServiceParams[i]
						}
					});
				}
			};
		}
	};

	// This will create matter and initiate backup for selected options
	const createBackup = async () => {
		console.log("inside createBackup requestBackup: ", requestBackup);
		setLoading(true);
		let response = await axios.post(config.urls.backup.initiate(), requestBackup);
		if (response.status === 404) {
			setLoading(false);
			return Promise.resolve([]);
		}
		response = response.data;
		notify.success(response.result);
		getMatterStatus();
		console.log("createBackup res: ", response);
		setLoading(false);
	};

	const createBulkBackup = async () => {
		console.log("bulkRequestBackup: ", bulkRequestBackup);
		setLoading(true);

		for (let i = 0; i < bulkRequestBackup.length; i++) {
			try {
				const response = await axios.post(config.urls.backup.initiate(), bulkRequestBackup[i]);
				console.log("initiated is : ", response.data);
				const percentageCompleted = (i + 1) * 100 / bulkRequestBackup.length;
				notify.success(percentageCompleted + "% Upload Completed");
			} catch (err) {
				const errorJson = {
					accountEmail: bulkRequestBackup[i].accountEmail,
					errorMsg: err.response.data.message
				};
				const response = await axios.post(config.urls.backup.errorEntry(), errorJson);
				console.log("error is : ", err);
				console.log("error log operation is: ", response.data);
			}
		};
		notify.success(100 + "% Upload Completed");

		setBulkRequestBackup([]);
		setLoading(false);
		showDeleteModal(false);
	};

	// diaptch modal for create backup
	const createBackupModal = (e, type) => {
		e.preventDefault();
		if (type === "single") {
			dispatchModal({
				type: "open",
				payload: {
					title: "Create backup",
					content: "This will create a backup of the selected user. Do you want to proceed?",
					onSuccess: createBackup
				}
			});
		} else {
			dispatchModal({
				type: "open",
				payload: {
					title: "Create backup",
					content: "This will create backups using the selected file. Do you want to proceed?",
					onSuccess: createBulkBackup
				}
			});
		};
	};
	function hasSomeTrueService (myObject) {
		const reqBackupStatus = Object.values(myObject.services).some((value) => value !== false);
		return reqBackupStatus;
	}
	function hasAllTrueService (myObject) {
		const reqBackupStatus = Object.values(myObject.services).every((value) => value !== false);
		return reqBackupStatus;
	}

	return (
		<>
			{!deleteModal &&
			<>
				<div className="flex-grow flex overflow-x-hidden h-full">
					(<div className="xl:w-72 w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 lg:block">
						<h1 className="text-center pt-3 pb-3 pageTitle bg-blue-500 text-white">Suspended User</h1>
						<div className="px-5 pt-2">
							<div className="text-xs text-gray-400 tracking-wider">Users or Groups</div>
							<SearchBar
								query={query}
								setQuery={(e) => {
									e.preventDefault();
									setQuery(e.target.value);
								}}
								placeHolderForSearchBar={"Search Users or Groups..."}
							/>
						</div>
						<div className="space-y-4 px-5 pt-1 overflow-y-auto h-80">
							{
								isSearching
									? <div className="mt-15 flex justify-center items-center pl-8">
										<Lottie style={{ height: 250 }} animationData={searchingGif} loop={true} rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} />
									</div>
									: (
										(results.length > 0)
											? results.map((result, index) => {
												return (
													<BasicCard
														key={index}
														cardTitle={result?.name.fullName || result?.name}
														cardContent={result?.primaryEmail || result?.email}
														// userImgUrl={result?.photo}
														isSelected={(!(selectedUser === undefined)) && (selectedUser?.name === result?.name) && (selectedUser?.email === result?.email) && (selectedUser?.photo === result?.photo)}
														setSelectedUser={(e) => {
															// selectUser(e, result);
															e.preventDefault();
															// getMatterStatus();
															setSelectedUser(result);
														}}
														className="btnEffect"
													/>
												);
											})
											: (query.length > 0
												? <div className="flex" style={{ overflow: "hidden" }}>
													<Lottie style={{ height: 350 }} animationData={noResultsGif} loop={true}
														rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
													/>
												</div>
												: <div className="flex mt-15 pl-8" style={{ overflow: "hidden" }}>
													<Lottie style={{ height: 250 }} animationData={searchingGif} autoplay={false}
														rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
													/>
												</div>
											)
									)
							}
						</div>
					</div>
					{loading && <Loader />}
					{!loading &&
						selectedUser
						? (
							<div className="flex-grow bg-gray-900 overflow-y-auto">
								<div className="syncPageTopBar p-4 py-4 px-5 flex flex-row items-center w-full border-b border-gray-200 bg-gray-900 dark:text-white dark:border-gray-800">
									<Button sx={{ marginRight: "1rem" }} onClick={() => setSelectedUser(undefined) }><ArrowBackIcon sx={{ fontSize: "2rem" }}></ArrowBackIcon></Button>
									<ContentHeader
										headerAvatar={selectedUser?.photo}
										headerName={selectedUser?.name.fullName || selectedUser?.name}
										headerContent={selectedUser?.primaryEmail || selectedUser?.email}
									>
									</ContentHeader>
								</div>
								{!loading
									? (
										<div>
											{selectedUser.primaryEmail
												? (
													<Container maxWidth={false} sx={{ marginTop: 3 }}>
														<Grid spacing={2} container>
															{
																config
																	.userBackupOptions
																	.map((backupOption, i) => {
																		return (
																			<Grid item key={i} xs={12} sm={6} md={4}>
																				<CheckCard
																					title={backupOption.label}
																					name={backupOption.value}
																					avatar={backupOption.icon}
																					disabled={matterStatus !== undefined ? matterStatus?.services[backupOption.value] : true}
																					checked={requestBackup?.services?.[backupOption.value] !== false}
																					// disabled={matterStatus?.services[backupOption.value]}
																					// checked={matterStatus?.services[backupOption.value]}
																					onClick={selectedBackupOptions}
																					content={matterStatus?.serviceList?.filter((val) => val.service === backupOption.value)[0]}
																					serviceParamsStateChanger={setFinalServiceParams}
																					finalServiceParamsNew={finalServiceParams}
																				/>
																				{/* {console.log("here: ", matterStatus?.serviceList?.filter((val) => val.service === backupOption.value)[0]?.statusCode)} */}
																			</Grid>
																		);
																	})
															}
														</Grid>
														<Box display={"flex"} justifyContent={"center"} height={"100%"} my={10}>
															{/* {(matterStatus !== undefined ? hasAllTrueService(matterStatus) : false) && <h1>Backup initiated</h1>} */}
															<Button
																variant="contained"
																color="primary"
																// disabled={!hasSomeTrueService(requestBackup)}
																disabled={matterStatus === undefined ? !hasSomeTrueService(requestBackup) : (!hasSomeTrueService(requestBackup) || hasAllTrueService(matterStatus))}
																onClick={(event) => { createBackupModal(event, "single"); }}
															>
																Create Backup
															</Button>
															{/* {console.log("here ", matterStatus === undefined ? !hasSomeTrueService(requestBackup) : (!hasSomeTrueService(requestBackup) || hasAllTrueService(matterStatus)))} */}
														</Box>
													</Container>
												)
												: <Container maxWidth={false} sx={{ marginTop: 3 }}>
													<Grid spacing={2} container>
														{
															<Grid item key={0} xs={12} sm={6} md={4}>
																<CheckCard
																	title={config.groupBackupOptions[0].label}
																	name={config.groupBackupOptions[0].value}
																	avatar={config.groupBackupOptions[0].icon}
																	disabled={matterStatus !== undefined ? matterStatus?.services[config.groupBackupOptions[0].value] : true}
																	checked={requestBackup?.services?.[config.groupBackupOptions[0].value]}
																	// disabled={matterStatus?.services[backupOption.value]}
																	// checked={matterStatus?.services[backupOption.value]}
																	onClick={selectedBackupOptions}
																	content={matterStatus?.serviceList?.filter((val) => val.service === config.groupBackupOptions[0].value)[0]}
																	serviceParamsStateChanger={setFinalServiceParams}
																	finalServiceParamsNew={finalServiceParams}
																/>
																{/* {console.log("here: ", matterStatus?.serviceList?.filter((val) => val.service === backupOption.value)[0]?.statusCode)} */}
															</Grid>
														}
													</Grid>
													<Box display={"flex"} justifyContent={"center"} height={"100%"} my={10}>
														{/* {(matterStatus !== undefined ? hasAllTrueService(matterStatus) : false) && <h1>Backup initiated</h1>} */}
														<Button
															variant="contained"
															color="primary"
															// disabled={!hasSomeTrueService(requestBackup)}
															disabled={matterStatus === undefined ? !hasSomeTrueService(requestBackup) : (!hasSomeTrueService(requestBackup) || hasAllTrueService(matterStatus))}
															onClick={(event) => { createBackupModal(event, "single"); }}
														>
															Create Backup
														</Button>
														{/* {console.log("here ", matterStatus === undefined ? !hasSomeTrueService(requestBackup) : (!hasSomeTrueService(requestBackup) || hasAllTrueService(matterStatus)))} */}
													</Box>
												</Container>}
										</div>
									)
									: <Loader />}
							</div>
						)
						: <div className="flex flex-col items-center w-full mt-4">
							{/* <Grid item xs={12} lg={8}> */}
							{/* <Grid container spacing={2}> */}
							{/* <Grid item xs={12}> */}
							{/* <Typography variant="h3" marginY={2}>Backup Status</Typography> */}
							<Grid container spacing={2} paddingX={2}>
								<Grid xs={12} sm={6} lg={4} item>
									<DashboardCard
										amount={dashboardData !== undefined ? dashboardData.completed : 0}
										label='Backups completed'
										icon={completedBackup}
										gradientColor={["#FFF", "#FFF"]}
										width={"100%"}
										height={80}
									/>
								</Grid>
								<Grid xs={12} sm={6} lg={4} item>
									<DashboardCard
										amount={dashboardData !== undefined ? dashboardData.onGoing : 0}
										label='Backups ongoing'
										icon={inProgressBackup}
										gradientColor={["#FFF", "#FFF"]}
										width={"100%"}
										height={80}
									/>
								</Grid>
								<Grid xs={12} sm={6} lg={4} item>
									<DashboardCard
										amount={dashboardData !== undefined ? dashboardData.yetToStart : 0}
										label='Backups yet to start'
										icon={yetToStartBackup}
										gradientColor={["#FFF", "#FFF"]}
										width={"100%"}
										height={80}
									/>
								</Grid>
							</Grid>
							{/* </Grid> */}
							{/* </Grid> */}
							{/* </Grid> */}
							{/* <Lottie style={{ height: 500 }} animationData={emptyTableGif} loop={true}
								rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
							/> */}
							{/* <UserDomainSyncTable tableData={tableData} /> */}
							<div className="syncPageTopBar p-4 py-4 px-5 flex flex-row items-center w-full border-b border-gray-200 bg-gray-900 dark:text-white dark:border-gray-800">
								<div className="flex w-full items-center bg-transparent">
									<div className="flex items-center vertical-align-center text-gray-900 dark:text-white">
										<div>
											<h4 className="text-2xl">{isErrorLog ? "Error Logs" : "Main Dashboard"}</h4>
										</div>
									</div>
								</div>
							</div>
							{
								!isErrorLog
									? <div className="w-full p-4" style={{ height: "100%" }}>
										<BackupTable fetchData={loadTableData} shouldRefresh={false} dayMode={false} />
									</div>
									: <div className="w-full p-4" style={{ height: "100%" }}>
										<ErrorTable fetchData={loadErrorTableData} shouldRefresh={false} dayMode={false} />
									</div>
							}
							{/* <Box sx={{ border: "1px solid gray", borderRadius: "1.1rem" }}> */}
							<div>
								<Button style={{ marginBottom: "40px", marginRight: "30px", marginLeft: "600px" }}
									sx={{
										backgroundColor: "#b366ff",
										borderRadius: "1rem 1rem 1rem 1rem",
										color: "#fff",
										fontSize: "0.8rem",
										fontWeight: "600",
										textTransform: "uppercase",
										"&:hover": {
											backgroundColor: "#b366ff"
										},
										width: "14rem",
										letterSpacing: 1.5
									}}
									onClick={() => { setIfErrorLog(!isErrorLog); }}
								>{isErrorLog ? "Show Main Dashboard" : "Show Error Logs"}
								</Button>
								<Button style={{ marginBottom: "40px" }}
									sx={{
										backgroundColor: "#b366ff",
										borderRadius: "1rem 1rem 1rem 1rem",
										color: "#fff",
										fontSize: "0.8rem",
										fontWeight: "600",
										textTransform: "uppercase",
										"&:hover": {
											backgroundColor: "#b366ff"
										},
										width: "14rem",
										letterSpacing: 1.5
									}}
									onClick={() => { showDeleteModal(true); }}
								>Bulk Initiate Backup
								</Button>
							</div>
							{/* </Box> */}
						</div>
					}
				</div>
			</>}
			{deleteModal &&
			<>
				{loading
					? <Loader/>
					: (<Container style={{ textAlign: "center", backgroundColor: "white", margin: "auto", minWidth: "85vw" }}>
						<Box display="flex" justifyContent="space-between" alignItems="center" paddingY="1rem" >
							<h2 style={{ fontWeight: "500" }}> Bulk Initiate Backup </h2>
							<CloseIcon className="cursor-pointer" onClick={() => { showDeleteModal(false); }} />
						</Box>
						<div
							className="card-body"
							style={{
								display: "flex",
								flexDirection: "column"
							}}
						>
							<BulkBackupForm onModalClick={(event) => { createBackupModal(event, "bulk"); }} bulkRequestBackupSetter = {setBulkRequestBackup}/>
						</div>
					</Container>)
				}
			</>
			}
		</>
	);
};

export default LeftUserBackup;
