/*eslint-disable*/
import moment from "moment";
import FetchProvider from "./fetchClient";
import defaultImage from "../assets/img/docTypeIcons/document.png";
import docImage from "../assets/img/docTypeIcons/document.png";
import audioImage from "../assets/img/docTypeIcons/audio.png";
import spreadsheetImage from "../assets/img/docTypeIcons/spreadsheet.png";
import drawingImage from "../assets/img/docTypeIcons/drawing.png";
import presentationImage from "../assets/img/docTypeIcons/presentation.png";
import formImage from "../assets/img/docTypeIcons/form.png";
import siteImage from "../assets/img/docTypeIcons/site.png";
import videoImage from "../assets/img/docTypeIcons/video.png";
import photoImage from "../assets/img/docTypeIcons/photo.png";
import pdfImage from "../assets/img/docTypeIcons/pdf.png";

const splitSeconds = (date) => {
	if (date === undefined) {
		return "";
	}
	return moment(date).format("HH:mm");
};

const getNameFromTo = (string) => {
	return string?.substring(0, string.indexOf("<"));
};

const getFirstEmailFromTo = (string) => {
	return string?.substring(string.indexOf("<"), string.indexOf(">") + 1);
};

const getListOfEmailFromTo = (string) => {
	if (string === undefined) return undefined;
	const emailArray = string.replace(/\"/g, "").replace(/\'/g, "").split(",");
	return emailArray;
}
const getListOfNameFromTo = (string) => {

	let nameString = "";
	getListOfEmailFromTo(string).map((item, index, arr) => {
		nameString = nameString + (item?.indexOf("<") !== -1 ?
			item?.substring(0, item.indexOf("<")) :
			item.substring(0, item.indexOf('@'))
		)
			+ (arr.length - 1 === index ? "" : ",");
	});
	return nameString;
}


const prettyDate = (date) => {
	if (date === undefined) {
		return "";
	}
	// const newdate = date.split(" ")[0].split("-");
	// const month = months[newdate[1] - 1];
	// const day = newdate[2];
	// const year = newdate[0];
	return moment(date).format("DD MMM, YYYY");
	// return (month + " " + day + ", " + year);
};

const truncateString = (string, length) => {
	if (string === undefined) return undefined;
	return string?.length > length ? string?.substring(0, length) + "..." : string?.substring(0, length);
};

const getDomainFromEmail = (email) => {
	return email?.split("@")[1];
};

const getUserRole = (role) => {
	if (role === "user") return "User";
	if (role === "admin") return "Admin";
	if (role === "superadmin") return "Super Admin";
	return "UnAssigned";
};

function isEmail(email) {
	const regex = /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regex.test(email);
}

const style = { height: "1.4rem" };
const getImage = (string) => {
	const extension = string.split(".").slice(-1)[0];
	switch (extension) {
		case "doc": case "docx":
			return <img src={docImage} style={style} />;

		case "ppt": case "pptx": case ".odp": case ".pps": case ".key":
			return <img src={presentationImage} style={style} />;

		case "xls": case "xlsx":
			return <img src={spreadsheetImage} style={style} />;

		case "mp4": case "mov": case "mkv":
			return <img src={videoImage} style={style} />;

		case "jpeg": case "jpg": case "svg": case "png":
			return <img src={photoImage} style={style} />;

		case "pdf":
			return <img src={pdfImage} style={style} />;

		default:
			return <img src={defaultImage} style={style} />;
	}
}

export {
	splitSeconds,
	prettyDate,
	truncateString,
	FetchProvider,
	getDomainFromEmail,
	getUserRole,
	getNameFromTo,
	getFirstEmailFromTo,
	isEmail,
	getImage,
	getListOfEmailFromTo,
	getListOfNameFromTo
};
