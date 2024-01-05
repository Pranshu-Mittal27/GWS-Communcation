/*eslint-disable*/
import PropTypes from "prop-types";
import { memo } from "react";
import { Paper, Box, Typography, Tooltip } from "@mui/material";
import AttachmentIcon from "@mui/icons-material/Attachment";
import { getImage, truncateString } from "../../helpers";

const EmailAttchment = ({ fileName }) => {
    return (
        <>
            <Tooltip title={fileName}>
                <Box sx={{ padding: "0.4rem 0.8rem", border: "0.1rem solid #D3D3D3", borderRadius: "2rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {getImage(fileName)}
                    <Typography sx={{ ml: "0.4rem", fontSize: "0.9rem" }}>{truncateString(fileName, 13)}</Typography>
                </Box>
                {/* < Paper sx={{ width: "10rem", backgroundColor: "" }}>
					<Box
						sx={{ display: "flex", justifyContent: "center", padding: "0.5rem", opacity: "" }}
					>

						<AttachmentIcon sx={{ fontSize: "3rem" }} />
					</Box>
					<Box sx={{ padding: "0.2rem", backgroundColor: "#D3D3D3", display: "flex", justifyContent: "start" }}>
						{getImage(fileName)}
						<Typography sx={{ ml: "0.4rem", fontSize: "0.9rem" }}>{truncateString(fileName, 13)}</Typography>
					</Box>
				</Paper> */}
            </Tooltip>

        </>
    );
};
EmailAttchment.propTypes = {
    fileName: PropTypes.string.isRequired
};

export default memo(EmailAttchment);
