import PropTypes from "prop-types";
import "./index.css";
import unknownUser from "../../../assets/unknown-user.png";
import mailIcon from "../../../assets/img/icons/unicons/mailIcon.png";

const BasicCard = ({ cardTitle = "Card title", cardContent = "Card Content", userImgUrl = undefined, isSelected = false, setSelectedUser, className = "" }) => {
	return (
		<div
			className={`bg-white p-3 w-full flex flex-col rounded-md dark:bg-gray-800 ${(isSelected === true) ? " shadow-lg relative ring-2 ring-blue-500 focus:outline-none" : " shadow"} ${className}`}
			onClick={setSelectedUser}
			style={{
				boxShadow: isSelected ? "0 0 0 3px rgba(66,153,225)" : "0 0 0 0 rgba(66,153,225,0.5)"
			}}
		>
			<div className="flex xl:flex-row flex-col items-center font-medium text-gray-900 dark:text-white pb-2 mb-2 border-b border-gray-200 border-opacity-75 dark:border-gray-700 w-full">
				<img src={(userImgUrl === undefined) ? unknownUser : userImgUrl} className="w-7 h-7 mr-2 rounded-full" alt="profile" referrerPolicy="no-referrer" />
				{cardTitle}
			</div>
			<div className="flex items-center w-full">
				<div className="flex items-center justify-center text-xs py-1 px-2 mx-auto xl:ml-auto xl:mr-0 leading-none dark:bg-gray-900 bg-blue-100 text-blue-500 rounded-md overflow-hidden text-ellipsis white-space-nowrap">
					<img src={mailIcon} alt="email" width="13px" className="mr-1" />
					{cardContent}
				</div>
			</div>
		</div>
	);
};

BasicCard.propTypes = {
	cardTitle: PropTypes.string.isRequired,
	cardContent: PropTypes.string.isRequired,
	userImgUrl: PropTypes.string,
	isSelected: PropTypes.bool.isRequired,
	setSelectedUser: PropTypes.func.isRequired,
	className: PropTypes.string
};

export default BasicCard;
