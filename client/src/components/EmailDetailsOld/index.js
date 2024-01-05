import { memo } from "react";
import PropTypes from "prop-types";
import { prettyDate } from "../../helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import "./index.css";

const EmailDetailsOld = ({ email = undefined, retractMail }) => {
	if (email === undefined) {
		return (
			<div className="email-details__wrapper col-md-8">
				<div className="empty-container">
					<div className="empty-container__content">
						Please Select a Mail
					</div>
				</div>
			</div>

		);
	}

	return (
		<div className="email-details__wrapper col-md-8">
			<div className="email-details__container">
				<div className="email-details__header">
					<div className="email-details__info">
						<strong>{email?.From}</strong>
						<span className="pull-right">{prettyDate(email?.Date)}</span>
					</div>
					<div>{email?.Subject}</div>
					<div className="email-details__buttons">
						{/* <div className="email-details__mark">
							<span onClick={() => { markUnRead(email.id); }}><i className="fa fa-edit markUnread" aria-hidden="true"></i></span>
						</div> */}
						<div className="email-details__mark">
							<span onClick={() => {
								retractMail(email?.id);
							}}><FontAwesomeIcon icon={faTrash} aria-hidden="true" /></span>
						</div>
					</div>
				</div>
				<div className="email-details__message">
					<p style={{ whiteSpace: "pre-wrap" }}>{email?.body}</p>
				</div>

			</div>
		</div>
	);
};

EmailDetailsOld.propTypes = {
	email: PropTypes.object,
	retractMail: PropTypes.func.isRequired
};

export default memo(EmailDetailsOld);
