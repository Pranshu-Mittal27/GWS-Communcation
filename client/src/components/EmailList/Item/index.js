
import PropTypes from "prop-types";
import { memo } from "react";
import { prettyDate, truncateString, getNameFromTo } from "../../../helpers";

// style import
import { Divider, Typography, Box, Stack, Checkbox } from "@mui/material";
const EmailListItem = ({ email, openEmail, selected, addDeleteEmail, removeDeleteEmail, userAction }) => {
	const toggleDelete = (e) => {
		if (e.target.checked) {
			addDeleteEmail(email?.id);
		} else {
			removeDeleteEmail(email?.id);
		}
	};
	return (

		<Box>
			<Stack
				direction="row"
				// spacing={0.1}
				sx={{ backgroundColor: selected ? "rgba(59, 130, 246, 0.15)" : "none", padding: "0.5rem", minHeight: "5rem" }}
			>
				<Box>
					<Checkbox
						// checked={true}
						onChange={toggleDelete}
						inputProps={{ "aria-label": "controlled" }}
						sx={{ padding: "0px", paddingRight: "0.5rem" }}
					/>
				</Box>
				<Box sx={{ margin: "0.1px", width: "100%" }} onClick={() => openEmail(email?.id)}>
					<Box sx={{
						display: "flex",
						justifyContent: "space-between"
					}}>

						<Typography variant="body1" fontWeight={600} sx={{ overflow: "hidden", letterSpacing: "0.4px" }}>
							{userAction
								? (getNameFromTo(email?.To) !== "" ? (truncateString(getNameFromTo(email?.To), 100)) : (truncateString((email?.To), 26)))
								: getNameFromTo(email?.To) !== "" ? (truncateString(getNameFromTo(email?.To), 100)) : (truncateString((email?.To), 29))}
							{/* hello hello */}
						</Typography>
						<Typography variant="body2" fontWeight={400}>
							{prettyDate(email?.Date)}
							{/* hello hello hello */}
						</Typography>
					</Box>
					<Typography variant="body1" fontWeight={400}>
						{userAction ? truncateString(email?.Subject, 120) : truncateString(email?.Subject, 40)}
					</Typography>
					{!userAction && <Typography variant="body2" fontWeight={200} sx={{}}>
						{userAction ? truncateString(email?.text, 45) : truncateString(email?.text, 50)}
					</Typography>}
				</Box>
			</Stack>
			<Divider />
		</Box>
	);
};

EmailListItem.propTypes = {
	email: PropTypes.object.isRequired,
	openEmail: PropTypes.func.isRequired,
	selected: PropTypes.bool.isRequired,
	addDeleteEmail: PropTypes.func.isRequired,
	removeDeleteEmail: PropTypes.func.isRequired,
	userAction: PropTypes.bool.isRequired
};

export default memo(EmailListItem);
