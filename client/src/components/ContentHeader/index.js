import PropTypes from "prop-types";
import { memo } from "react";
import unknownUser from "../../assets/unknown-user.png";

const ContentHeader = ({ headerAvatar = undefined, headerName, headerContent, children }) => {
	return (
		<div
			className="flex w-full items-center bg-transparent"
		>
			<div
				className="flex items-center vertical-align-center text-gray-900 dark:text-white"
			>
				<img
					src={(headerAvatar === undefined) ? unknownUser : headerAvatar}
					className="w-12 mr-4 rounded-full"
					alt="profile"
				/>
				<div>
					<h4 className="text-3xl">{headerName}</h4>
					<p className="text-gray-500 dark:text-gray">{headerContent}</p>
				</div>
			</div>
			<div
				className="ml-auto sm:flex hidden items-center justify-end"
			>
				{children}
			</div>
		</div>
	);
};

ContentHeader.propTypes = {
	headerAvatar: PropTypes.string,
	headerName: PropTypes.string.isRequired,
	headerContent: PropTypes.string.isRequired,
	children: PropTypes.element
};

export default memo(ContentHeader);
