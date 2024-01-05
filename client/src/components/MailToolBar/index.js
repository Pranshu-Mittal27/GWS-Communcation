import { memo } from "react";
import PropTypes from "prop-types";
import "./index.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faFilter, faTrash } from "@fortawesome/free-solid-svg-icons";

const MailToolBar = ({ isDeleteButtonVisible, deleteAllMails, openFilter, goToNextPage }) => {
	return (
		<div className="topbar col-md-12">
			<ul>
				<li>Mail-Box | Sent</li>
				<li>
					{/* <i className="fa fa-chevron-left"></i> */}
					<FontAwesomeIcon icon={faChevronLeft} />
					{" "}|{" "}
					{/* <i
						className="fa fa-chevron-right"
					// nClick={(e) => goToNextPage()}
					></i> */}
					<FontAwesomeIcon icon={faChevronRight} />
				</li>
				<li className="right-icons white">
					{
						isDeleteButtonVisible &&

						<span>
							<FontAwesomeIcon icon={faTrash} aria-hidden="true" onClick={deleteAllMails} />
						</span>
					}
					<span>
						<FontAwesomeIcon icon={faFilter} aria-hidden="true" onClick={openFilter} />
					</span>
				</li>
			</ul>
		</div>
	);
};

MailToolBar.propTypes = {
	isDeleteButtonVisible: PropTypes.any.isRequired,
	deleteAllMails: PropTypes.func.isRequired,
	openFilter: PropTypes.func.isRequired,
	goToNextPage: PropTypes.func.isRequired
};

export default memo(MailToolBar);
