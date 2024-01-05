import { Box, Card, CardHeader, Stack, Tooltip } from "@mui/material";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Android12SyncSwitch, Android12UnSyncSwitch } from "../../Switch";

const DomainSyncStatusCard = ({ domain, addDomainToList, removeDomainFromList, unSync }) => {
	console.log("domain : ", domain);
	const [calendarStatus, setcalendarStatus] = useState(false);
	const [contactStatus, setContactStatus] = useState(false);
	const [resourceStatus, setResourceStatus] = useState(false);

	useEffect(() => {
		setcalendarStatus(domain.calendarStatus);
		setContactStatus(domain.contactStatus);
		setResourceStatus(domain.resourceStatus);
	}, [domain, unSync]);

	return (
		<Card sx={{
			width: "300px",
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			boxShadow: "0 0 0 1px #e0e0e0"
		}}>
			<CardHeader title={domain.name} titleTypographyProps={{
				variant: "display1"
			}} sx={{
				textAlign: "center",
				padding: "0.75rem",
				// fontWeight: "bold",
				fontSize: "1.15rem"
			}} />
			<Box sx={{
				margin: "0",
				padding: "0.5rem",
				borderTop: "1px solid #e0e0e0"
				// borderBottom: "1px solid #e0e0e0"
				// backgroundColor: "#f6f6f6",
			}}>
				<Stack direction="row">
					<Tooltip title={domain.calendarStatus ? "Calendar/Mail is Synced" : "Calendar/Mail is Not Synced"}>
						<Stack sx={{
							width: "100%",
							backgroundColor: "#e4e4e7",
							borderRadius: "20px 0 20px 0",
							margin: "5px",
							padding: "5px"
						}} direction="row">
							<Box width={"100%"} display="flex" alignItems="center" justifyContent="center">
								<img src={require("../../../assets/img/icons/brands/google-calendar.png")} alt="Calendar" width={"24rem"} />
							</Box>
							<Box width={"100%"} display="flex" alignItems="center" justifyContent="center">
								{!unSync &&
									<Android12SyncSwitch checked={calendarStatus} disabled={domain.calendarStatus} onChange={() => {
										!calendarStatus ? addDomainToList(domain.name, "calendarList") : removeDomainFromList(domain.name, "calendarList");
										setcalendarStatus(!calendarStatus);
									}} />
								}
								{unSync &&
									<Android12UnSyncSwitch checked={calendarStatus} disabled={!domain.calendarStatus} onChange={() => {
										calendarStatus ? addDomainToList(domain.name, "calendarList") : removeDomainFromList(domain.name, "calendarList");
										setcalendarStatus(!calendarStatus);
									}} />
								}
							</Box>
						</Stack>
					</Tooltip>

					<Tooltip title={domain.contactStatus ? "Contacts are Synced" : "Contacts are Not Synced"}>
						<Stack sx={{
							width: "100%",
							backgroundColor: "#e4e4e7",
							borderRadius: "0 20px 0 20px",
							margin: "5px",
							padding: "5px"
						}} direction="row">
							<Box width={"100%"} display="flex" alignItems="center" justifyContent="center">
								<img src={require("../../../assets/img/icons/brands/google-contacts.png")} alt="Contacts" width={"22rem"} />
							</Box>
							<Box width={"100%"} display="flex" alignItems="center" justifyContent="center">
								{!unSync &&
									<Android12SyncSwitch checked={contactStatus} disabled={domain.contactStatus} onChange={() => {
										!contactStatus ? addDomainToList(domain.name, "contactList") : removeDomainFromList(domain.name, "contactList");
										setContactStatus(!contactStatus);
									}} />
								}
								{unSync &&
									<Android12UnSyncSwitch checked={contactStatus} disabled={!domain.contactStatus} onChange={() => {
										contactStatus ? addDomainToList(domain.name, "contactList") : removeDomainFromList(domain.name, "contactList");
										setContactStatus(!contactStatus);
									}} />
								}
								{/* <Android12Switch checked={false} onChange={() => {
									console.log("clicked switch");
								}} /> */}
							</Box>
						</Stack>
					</Tooltip>

					<Tooltip title={domain.resourceStatus ? "Resources are Synced" : "Resources are Not Synced"}>
						<Stack sx={{
							width: "100%",
							backgroundColor: "#e4e4e7",
							borderRadius: "0 20px 0 20px",
							margin: "5px",
							padding: "5px"
						}} direction="row">
							<Box width={"100%"} display="flex" alignItems="center" justifyContent="center">
								<img src={require("../../../assets/img/icons/brands/calendar-resources.png")} alt="Resources" width={"22rem"} />
							</Box>
							<Box width={"100%"} display="flex" alignItems="center" justifyContent="center">
								{!unSync &&
									<Android12SyncSwitch checked={resourceStatus} disabled={domain.resourceStatus} onChange={() => {
										!resourceStatus ? addDomainToList(domain.name, "resourceList") : removeDomainFromList(domain.name, "resourceList");
										setResourceStatus(!resourceStatus);
									}} />
								}
								{unSync &&
									<Android12UnSyncSwitch checked={resourceStatus} disabled={!domain.resourceStatus} onChange={() => {
										resourceStatus ? addDomainToList(domain.name, "resourceList") : removeDomainFromList(domain.name, "resourceList");
										setResourceStatus(!resourceStatus);
									}} />
								}
								{/* <Android12Switch checked={false} onChange={() => {
									console.log("clicked switch");
								}} /> */}
							</Box>
						</Stack>
					</Tooltip>
				</Stack>
			</Box>
			{/* <Box sx={{
				width: "100%",
				height: "2rem",
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			}}>
				Last Synced: 12/12/2021
			</Box> */}
		</Card>
	);
};

DomainSyncStatusCard.propTypes = {
	domain: PropTypes.object.isRequired,
	addDomainToList: PropTypes.func.isRequired,
	removeDomainFromList: PropTypes.func.isRequired,
	unSync: PropTypes.bool.isRequired
};

export default DomainSyncStatusCard;
