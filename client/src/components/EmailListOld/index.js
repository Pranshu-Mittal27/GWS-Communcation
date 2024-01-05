import { memo } from "react";
import EmailListItem from "./Item";
import PropTypes from "prop-types";

import "./index.css";

const EmailListOld = ({ emails, getSelectedEmail, selectedEmail, addDeleteEmail, removeDeleteEmail }) => {
	if (emails.length === 0) {
		return (
			<div className="email-list__wrapper col-md-4">
				<div className="empty-container">
					<div className="empty-container__content">
                        Nothing to See Here
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="email-list__wrapper col-md-4">
			<div className="email-list__container">
				{
					emails.map((email, i) => {
						return <EmailListItem key={email?.id} email={email} openEmail={getSelectedEmail} selected={selectedEmail?.id === email?.id} addDeleteEmail={addDeleteEmail} removeDeleteEmail={removeDeleteEmail} />;
					})
				}
			</div>
		</div>
	);
};

EmailListOld.propTypes = {
	emails: PropTypes.array.isRequired,
	getSelectedEmail: PropTypes.func.isRequired,
	selectedEmail: PropTypes.object,
	addDeleteEmail: PropTypes.func.isRequired,
	removeDeleteEmail: PropTypes.func.isRequired
};

export default memo(EmailListOld);
