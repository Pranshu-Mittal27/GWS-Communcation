import PropTypes from "prop-types";
import { memo } from "react";

// style import
import { Box, Tooltip, IconButton, Divider } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
// import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
// import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';

const EmailTopBar = ({ deleteAllMails, isFilter, toggleFilter, changePage, pageTokenArray, emailCount, refreshMails, toDeleteMails, loader }) => {
	// console.log("email", emails);

	return (
		<>
			<Box className="emailTopBar" sx={{ height: "5.6vh" }}>
				<Box sx={{ display: "flex", justifyContent: "flex-start", ml: "1rem" }}>
					<Tooltip title={"Delete selected mail"}>
						<IconButton
							className="btnEffect"
							variant="contained"
							sx={{
								padding: "5px"

							}}
							onClick={deleteAllMails}
							disabled={toDeleteMails.length === 0}
						>
							<DeleteIcon
								sx={{ fontSize: 25, color: "" }}

							/>
						</IconButton>
					</Tooltip>
					<Tooltip title={"Refresh mail"}>
						<IconButton
							className="btnEffect"
							variant="contained"
							sx={{
								padding: "5px",
								ml: "1rem"
							}}
							onClick={refreshMails}
						>
							<RefreshIcon
								sx={{ fontSize: 25, color: "" }}
							/>
						</IconButton>
					</Tooltip>

					<Tooltip title={"Filter"}>
						<IconButton
							className="btnEffect"
							variant="contained"
							sx={{
								marginRight: "0.3rem",
								padding: "5px",
								ml: "1rem"
							}}
							onClick={() => toggleFilter(isFilter)}
						>
							<FilterAltIcon
								sx={{ fontSize: 25, color: "" }}
							/>
						</IconButton>
					</Tooltip>

				</Box>
				{
					!isFilter &&
					<Box sx={{ mr: "1rem", mt: "0.1rem", display: "flex", justifyContent: "flex-end" }} >
						<Box sx={{ ml: "2rem" }}>
							<Tooltip title={"Left Navigation"}>
								<IconButton
									className="btnEffect"
									variant="contained"
									sx={{
										marginRight: "0.3rem",
										padding: "5px"
									}}
									disabled={pageTokenArray.length < 2}
									onClick={() => {
										// console.log("Left");
										if (pageTokenArray.length === 2) { changePage(undefined, "left"); } else { changePage(pageTokenArray[pageTokenArray.length - 3], "left"); }
									}}
								>
									<ChevronLeftIcon sx={{ color: "" }} />
								</IconButton>
							</Tooltip>

							{(emailCount.length !== 0 && !loader) &&
								<Box component="span" sx={{ mt: "3rem" }}>
									{(pageTokenArray.length - 1) * 10 + 1}-{(pageTokenArray.length - 1) * 10 + emailCount.length}
								</Box >
							}
							<Tooltip title={"Right Navigation"}>
								<IconButton
									className="btnEffect"
									variant="contained"
									sx={{
										marginLeft: "0.3rem",
										padding: "5px"
									}}
									disabled={pageTokenArray[pageTokenArray.length - 1] === undefined}
									onClick={() => {
										// console.log("Right");
										changePage(pageTokenArray[pageTokenArray.length - 1], "right");
									}}
								>
									<ChevronRightIcon sx={{ color: "" }} />
								</IconButton>
							</Tooltip>
						</Box>
					</Box>
				}
			</Box>
			<Divider sx={{ borderBottomWidth: "0.1rem" }} />
		</>
	);
};

EmailTopBar.propTypes = {
	deleteAllMails: PropTypes.func.isRequired,
	isFilter: PropTypes.bool.isRequired,
	toggleFilter: PropTypes.func.isRequired,
	changePage: PropTypes.func.isRequired,
	pageTokenArray: PropTypes.array.isRequired,
	emailCount: PropTypes.array.isRequired,
	refreshMails: PropTypes.func.isRequired,
	toDeleteMails: PropTypes.array.isRequired,
	loader: PropTypes.bool.isRequired
};

export default memo(EmailTopBar);
