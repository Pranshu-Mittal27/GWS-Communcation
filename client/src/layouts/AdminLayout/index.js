/* eslint-disable*/
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { config } from "../../config";
import { BasicCard, ContentHeader, SearchBar, ThreeStateToggle } from "../../components";
// import UserDomainSyncTable from "../../components/Table/UserDomainSync";
import { DomainSyncStatus } from "../../components/Cards";
// eslint-disable-next-line no-unused-vars
import { Box, Container, Grid, Tooltip, Tabs, Tab, Button, Accordion, AccordionSummary, AccordionDetails, Typography, tooltipClasses, styled } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useData, useDebounce, useSearch, ModalConsumer } from "../../hooks";

import { Android12Switch } from "../../components/Switch";
// import { ThreeWayToggleSlider } from "../../components/Slider";
import Lottie from "lottie-react";
import searchingGif from "../../assets/img/illustrations/searching.json";
import noResultsGif from "../../assets/img/illustrations/no-results-found.json";
import emptyTableGif from "../../assets/img/illustrations/empty-table.json";
import domainIcon from "../../assets/img/icons/unicons/domainIcon.png";
import notify from "../../components/Toast";
import driveAutoMoveGif from "../../assets/img/illustrations/driveAutoMove.json";
import MailBox from "../../pages/MailBox";
import syncDomainIcon from "../../assets/img/icons/unicons/syncDomainIcon.png";
import driveIcon from "../../assets/img/icons/unicons/driveIcon.png";
import gmailIcon from "../../assets/img/icons/unicons/gmailIcon.png";

const HtmlTooltip = styled(({ className, ...props }) => (
	<Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
	[`& .${tooltipClasses.tooltip}`]: {
		// backgroundColor: "#f5f5f9",
		backgroundColor: "#e4e4e7",
		color: "rgba(0, 0, 0, 0.87)",
		border: "1px solid #dadde9",
		maxWidth: "30rem"
	}
}));

const AdminLayout = ({ toggleAutoSyncEnable, pageName, searchFetch, contentHeaderSyncButtonAction, placeHolderForSearchBar, tableDataFetch, keyToSearchBy, resources, showProgress, getCurrentProgress }) => {
	// search bar
	const { query, setQuery, results, isSearching } = useSearch({
		fetchFunction: searchFetch,
		searchDelay: 500
	});

	// currently selected user
	const [selectedUser, setSelectedUser] = useState(undefined);

	// search functionality for cards
	const { value: dataSearch, debouncedValue: deferredDataSearch, setValue: setDataSearch } = useDebounce("", 500);

	// store index of the filter selection
	const [filterState, setFilterState] = useState(() => {
		return resources.map(resource => resource.defaultSelection);
	});

	const myFilters = useMemo(() => {
		const temp = [];
		for (let index = 0; index < filterState.length; index++) {
			const state = filterState[index];
			if (!(resources[index].states[state].filter.value === "all")) {
				temp.push(resources[index].states[state].filter);
			}
		}
		return temp;
	}, [filterState, resources]);

	// cards data
	const { items, autoSync, driveAutoMove, domainDriveStatus, searchByKey, filterByKey, selectedItems: syncObject, addDomainToList, removeDomainFromList, refetchFunction, resetSelectedItems } = useData({
		user: selectedUser,
		fetchFunction: useCallback(() => tableDataFetch(selectedUser), [selectedUser, tableDataFetch]),
		dataSearch,
		filterState
	});

	const { dispatch: dispatchModal } = ModalConsumer();

	// autoSyncStatus toggle variable
	const [autoSyncStatus, setAutoSyncStatus] = useState(autoSync);
	const [unSync, setUnSync] = useState(false);
	// const [syncAllDomainsStatus, setSyncAllDomainsStatus] = useState(false);

	// driveAutoMove toggle variable
	const [driveAutoMoveStatus, setDriveAutoMoveStatus] = useState(driveAutoMove);

	// useEffect for updating autoSync
	useEffect(() => {
		setAutoSyncStatus(autoSync);
	}, [autoSync, selectedUser]);

	// useEffect for updating driveAutoMove
	useEffect(() => {
		setDriveAutoMoveStatus(driveAutoMove);
	}, [driveAutoMove, selectedUser]);

	// onSuccess of toggleDriveAutoMove dispatch, this function will be call
	const changeDriveAutoMoveStatus = async (domain, driveAutoMove, selectedUser) => {
		if (pageName === "Domain") {
			const response = await axios.put(config.urls.domains.changeAutoSyncStatus(domain), {
				driveAutoMove
				// autoSync: ""
			});
			if (response.status === 200) {
				setDriveAutoMoveStatus(driveAutoMove);
			}
			return response;
		} else {
			const response = await axios.put(config.urls.users.updateSyncStatus(), {
				email: selectedUser.email,
				driveAutoMove
			});
			if (response.status === 200) {
				setDriveAutoMoveStatus(driveAutoMove);
			}
			return response;
		}
	};

	// diaptch for toggleDriveAutoMove status
	const toggleDriveAutoMove = (e, driveAutoMove, domain) => {
		e.preventDefault();
		dispatchModal({
			type: "open",
			payload: {
				title: !driveAutoMove ? "Enable Drive Auto Move" : "Disable Drive Auto Move",
				content: `Make sure you have read the given details. Do you really want to ${!driveAutoMove ? "enable" : "disable"} Drive Auto Move?`,
				onSuccess: () => { changeDriveAutoMoveStatus(domain, !driveAutoMoveStatus, selectedUser); }
			}
		});
	};

	const toggleUnSync = (e, unSync) => {
		e.preventDefault();
		if (unSync) {
			setUnSync(false);
		} else {
			setUnSync(true);
		}
		// setUnSync(!unSync);
		// dispatchModal({
		// type: "open",
		// payload: {
		// title: !syncStatus ? "Enable Sync View" : "Disable Sync View",
		// content: !syncStatus ? "Do you want to enable Sync View?" : "Do you want to disable Sync View?",
		// onSuccess: () => { setSyncStatus(!syncStatus); }
		// }
		// });
	};

	console.log("syncObject", syncObject);

	const tabElems = [
		{
			label: "Sync Domain",
			logo: syncDomainIcon,
			elem: <div>
				<div className="flex items-center justify-between mt-4 pt-1">
					{/* <div className="flex items-ceter justify-between"> */}
					<div className="flex flex-col items-start justify-between">
						{/* <h1>{!unSync ? "Sync Domain" : "Unsync Domain"}</h1> */}
						{/* <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" marginRight="6rem" >
						<h4>Unsync</h4>
						<Tooltip title={syncStatus ? "Sync view enabled" : "Unsync view enabled"}>
							<Android12Switch
								checked={syncStatus}
								onChange={(e) => toggleSyncStatus(e, syncStatus) }
							/>
						</Tooltip>
						<h4>Sync</h4>
					</Box> */}
						{/* <Button
							onClick={(e) => toggleUnSync(e, unSync)}
							variant="contained"
							size="small"
							sx={{
								// backgroundColor: "#0064ff",
								backgroundColor: "#b366ff",
								color: "#fff",
								borderRadius: "0.3rem",
								// ml: "1rem",
								mt: "0.7rem",
								padding: "0 0.3rem",
								"&:hover": {
									backgroundColor: "#b366ff"
								},
								textTransform: "capitalize",
								fontSize: 12
							}}
						>
							{!unSync ? "Switch to Unsync" : "Switch to Sync"}
						</Button> */}
						<Box sx={{ border: "1px solid gray", borderRadius: "1.1rem" }}>
							<Button
								sx={{
									backgroundColor: unSync ? "none" : "#b366ff",
									borderRadius: "1rem 0 0 1rem",
									color: unSync ? "black" : "#fff",
									fontSize: "0.8rem",
									fontWeight: unSync ? "400" : "600",
									textTransform: "uppercase",
									"&:hover": {
										backgroundColor: unSync ? "none" : "#b366ff"
									},
									"&:onMousePress": {
										backgroundColor: "none"
									},
									width: "10rem",
									letterSpacing: 1.5
								}}
								onClick={(e) => toggleUnSync(e, true)}
								disableRipple={true}
								// disabled={!unSync}
							>Sync View
							</Button>
							<Button
								sx={{
									backgroundColor: !unSync ? "none" : "#b366ff",
									borderRadius: "0 1rem 1rem 0",
									color: !unSync ? "black" : "#fff",
									fontSize: "0.8rem",
									fontWeight: !unSync ? "400" : "600",
									textTransform: "uppercase",
									"&:hover": {
										backgroundColor: !unSync ? "none" : "#b366ff"
									},
									width: "10rem",
									letterSpacing: 1.5
								}}
								onClick={(e) => toggleUnSync(e, false)}
								disableRipple={true}
								// disabled={unSync}
							>Unsync View
							</Button>
						</Box>
					</div>
					<div className="flex">
						{/* This was for Syncing All Sub Domains of a Parent Domain. */}
						{/* {isParent &&
							<Tooltip title={!unSync ? "Sync All Sub Domains" : "Unsync All Sub Domains"}>
								<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" marginRight="2rem" >
									<Android12Switch
										checked={syncAllDomainsStatus}
										onChange={(e) => { console.log("syncAllDomainsStatus", syncAllDomainsStatus); setSyncAllDomainsStatus(!syncAllDomainsStatus); }}
									/>
									<h4>{!unSync ? "Sync All Sub Domains" : "Unsync All Sub Domains"}</h4>
								</Box>
							</Tooltip>
						} */}
						{showProgress &&
							<Tooltip title={autoSyncStatus ? "Auto Sync enabled" : "Auto Sync disabled"}>
								<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" marginRight="6rem" >
									<Android12Switch
										checked={autoSyncStatus}
										onChange={(e) => { console.log("autoSyncStatus", autoSyncStatus); toggleAutoSyncEnable(e, autoSyncStatus, selectedUser.name, setAutoSyncStatus); }}
									/>
									<h4>Auto Sync</h4>
								</Box>
							</Tooltip>
						}
						<Tooltip title={pageName === "Domain" ? "Sync Domain" : "Sync User"}>
							<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" marginRight="1.5rem" >
								<div
									// aria-disabled={true}
									className="cursor-pointer "
									onClick={async (e) => {
										if (syncObject.calendarList.length === 0 && syncObject.contactList.length === 0 && syncObject.resourceList.length === 0) {
											notify.error(`Please select contact or calendar or resources to ${!unSync ? "sync" : "unsync"}`);
										} else {
											const obj = { ...syncObject, domain: selectedUser.name };
											console.log("selected user: ", selectedUser);
											console.log("obj: ", obj);
											await contentHeaderSyncButtonAction(obj, refetchFunction, unSync, e);
											resetSelectedItems();
										}
										// await contentHeaderSyncButtonAction(syncObject, refetchFunction);
									}}
								>
									<img src={require("../../assets/img/icons/unicons/sync.png")} alt="sync" className="h-4 inline-block syncBtn btnEffect" width={35} height={35} />
								</div>
								<h4>{!unSync ? "Sync" : "Unsync"}</h4>
							</Box>
						</Tooltip>
					</div>
				</div>
				{
					showProgress
						? <div
							className="flex justify-between items-center p-3 mt-4 bg-blue-100"
						>
							Domain-wide sync / unsync takes time. Check if there are already running tasks.
							<button
								className="bg-blue-500 text-white border-none outline-none py-2 px-4 rounded-md"
								onClick={(e) => {
									e.preventDefault();
									getCurrentProgress();
								}}
							>
								See More
							</button>
						</div>
						: null
				}
				<div
					className="flex justify-between py-3"
				>
					<Box className="flex items-center">
						<SearchBar
							query={dataSearch}
							setQuery={(e) => {
								e.preventDefault();
								setDataSearch(e.target.value);
							}}
							placeHolderForSearchBar={`Search by ${keyToSearchBy}`}
						/>
						<HtmlTooltip
							title={
								<React.Fragment>
									<Typography sx={{ width: "100%", textAlign: "center" }} fontSize="1.2rem" fontWeight="600">Color Indicators</Typography>
									{!unSync && <Box className="flex">
										<img src={require("../../assets/img/references/switch1.png")} alt="switch1" width={40} className="mr-2" />
										<Typography color="inherit">Already synced & switch disabled</Typography>
									</Box>}
									{unSync && <Box className="flex">
										<img src={require("../../assets/img/references/switch2.png")} alt="switch2" width={40} className="mr-2" />
										<Typography color="inherit">Not synced & switch disabled</Typography>
									</Box>}
									{!unSync && <Box className="flex">
										<img src={require("../../assets/img/references/switch3.png")} alt="switch3" width={40} className="mr-2" />
										<Typography color="inherit">Not synced & switch can be toggled to sync</Typography>
									</Box>}
									{unSync && <Box className="flex">
										<img src={require("../../assets/img/references/switch4.png")} alt="switch4" width={40} className="mr-2" />
										<Typography color="inherit">Already synced & switch can be toggled to unsync</Typography>
									</Box>}
									{unSync && <Box className="flex">
										<img src={require("../../assets/img/references/switch5.png")} alt="switch5" width={40} className="mr-2" />
										<Typography color="inherit">Already synced & switch already toggled to unsync</Typography>
									</Box>}
									{!unSync && <Box className="flex">
										<img src={require("../../assets/img/references/switch6.png")} alt="switch6" width={40} className="mr-2" />
										<Typography color="inherit">Not synced & switch already toggled to sync</Typography>
									</Box>}
								</React.Fragment>
							}
						>
							<HelpOutlineIcon sx={{ marginLeft: "1rem" }} />
						</HtmlTooltip>
					</Box>
					<Box
						className="flex items-center justify-center ml-auto"
						sx={{
							gap: "10px"
						}}
					>
						{
							resources.map((resource, index) => {
								return (
									<ThreeStateToggle
										key={index}
										states={resource.states}
										defaultSelection={resource.defaultSelection}
										updateFilter={(updatedIndex) => {
											const newState = filterState;
											newState[index] = updatedIndex;
											setFilterState([...filterState]);
										}}
									/>
								);
							})
						}
					</Box>
				</div>
				<Grid spacing={20} container>
					{
						filterByKey(searchByKey(items, { key: keyToSearchBy, query: deferredDataSearch }), myFilters)
							.map((data, i) => {
								return (
									<Grid item key={i + dataSearch + filterState} xs={12} sm={6} md={4} lg={3}>
										<DomainSyncStatus domain={data} addDomainToList={addDomainToList} removeDomainFromList={removeDomainFromList} unSync={unSync} />
									</Grid>
								);
							})
					}
				</Grid>
			</div>
		},
		{
			label: "Drive auto move",
			logo: driveIcon,
			elem: <div>
				<div className="flex items-center justify-between py-6">
					<h1>Drive auto move</h1>
				</div>
				<div className="flex flex-col items-center justify-center">
					{/* <div className="flex" style={{ overflow: "hidden" }}> */}
					<Lottie style={{ height: 200 }} animationData={driveAutoMoveGif} loop={true}
						rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
					/>
					{/* </div> */}
					<Tooltip title={pageName === "Users" && domainDriveStatus === false ? "Drive auto mail has been disabled domain-wide. Please contact your admin." : (driveAutoMove ? "Drive Auto move enabled" : "Drive Auto move disabled")}>
						<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" margin="1rem 0" >
							<Android12Switch
								checked={pageName === "Users" && domainDriveStatus === false ? false : driveAutoMoveStatus}
								onChange={(e) => {
									if (pageName === "Users" && domainDriveStatus === false) { notify.error("Drive auto mail has been disabled domain-wide. Please contact your admin."); } else { toggleDriveAutoMove(e, driveAutoMove, selectedUser.name); }
								}}
							/>
							<h4>Drive Auto Move</h4>
						</Box>
					</Tooltip>
					<Accordion sx={{ width: "50%", mt: "1rem" }}>
						<AccordionSummary
							expandIcon={<ExpandMoreIcon />}
							aria-controls="panel1a-content"
							id="panel1a-header"
						>
							<Typography>Read more ...</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Typography>
								This is a critical task. Switching this option ON will move all the files from user drives to shared drives. And this process cannot be reverted back. So, please ensure that you understand the scope of this task.
							</Typography>
						</AccordionDetails>
					</Accordion>
				</div>
			</div>
		},
		...pageName === "Users"
			? [{
				label: "Mail Recall",
				logo: gmailIcon,
				elem: <MailBox
					selectedUser={selectedUser?.email}
					userAction={true}
				/>
			}]
			: []
	];
	const [value, setValue] = useState(0);

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	// console.log("syncObject", syncObject);
	return (
		<div className="flex-grow flex overflow-x-hidden h-full">
			<div className="xl:w-72 w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 lg:block">
				<h1 className="text-center pt-3 pb-3 pageTitle bg-blue-500 text-white">{showProgress ? "Domain action" : "User action"}</h1>
				<div className="px-5 pt-2">
					<div className="text-xs text-gray-400 tracking-wider">{pageName}</div>
					<SearchBar
						query={query.toLowerCase()}
						setQuery={(e) => {
							e.preventDefault();
							setQuery(e.target.value);
						}}
						placeHolderForSearchBar={placeHolderForSearchBar}
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
												cardTitle={result?.name}
												cardContent={showProgress ? `Admin: ${result?.email}` : result?.email}
												userImgUrl={showProgress ? domainIcon : result?.photo}
												isSelected={(!(selectedUser === undefined)) && (selectedUser?.name === result?.name) && (selectedUser?.email === result?.email) && (selectedUser?.photo === result?.photo)}
												setSelectedUser={(e) => {
													e.preventDefault();
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
			<div className="flex-grow bg-gray-900 overflow-y-auto ">
				{
					selectedUser
						? (
							<>
								<div className="syncPageTopBar py-4 px-5 flex flex-col w-full border-b border-gray-200 dark:text-white dark:border-gray-800 sticky top-0 bg-gray-100 elevation-2">
									<ContentHeader
										headerAvatar={showProgress ? domainIcon : selectedUser?.photo}
										headerName={selectedUser?.name}
										headerContent={selectedUser?.email}
									>
										<Tabs value={value} onChange={handleChange}>
											{tabElems.map((item) =>
												<Tooltip title={item.label} key={item.label}>
													<Tab icon={<img src={item.logo} alt={item.label} width={25} />} />
												</Tooltip>
												// <img src={item.logo} alt={item.label} key={item.label} width={30} />
												// <Tab key={item.label} label={item.label} logo={item.logo} />
											)}
										</Tabs>
									</ContentHeader>
								</div>
								<Container maxWidth={false}>
									{tabElems[value].elem}

								</Container>
							</ >
						)
						: <div className="flex items-center justify-center w-full">
							<Lottie style={{ height: 700 }} animationData={emptyTableGif} loop={true}
								rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
							/>
						</div>
				}
			</div>
		</div >
	);
};

AdminLayout.propTypes = {
	pageName: PropTypes.string.isRequired,
	searchFetch: PropTypes.func.isRequired,
	contentHeaderSyncButtonAction: PropTypes.func.isRequired,
	// contentHeaderUnSyncButtonAction: PropTypes.func.isRequired,
	placeHolderForSearchBar: PropTypes.string.isRequired,
	tableDataFetch: PropTypes.func.isRequired,
	keyToSearchBy: PropTypes.string.isRequired,
	resources: PropTypes.array.isRequired,
	showProgress: PropTypes.bool.isRequired,
	getCurrentProgress: PropTypes.func.isRequired,
	toggleAutoSyncEnable: PropTypes.func
};

export default memo(AdminLayout);
