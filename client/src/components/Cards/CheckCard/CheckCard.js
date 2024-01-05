import { Checkbox } from "@mui/material";
import PropTypes from "prop-types";

const CheckCard = ({ title, name, content, avatar, onClick, checked, disabled, serviceParamsStateChanger, finalServiceParamsNew }) => {
	console.log(name + " is " + checked);

	const handleChange = (event) => {
		onClick(event);
	};
	// let bucket = "";

	// const contentToRender = () => {
	// let result = "";
	// switch (content?.statusCode) {
	// case -1:
	// result = "User does not have license";
	// break;
	// case 0:
	// result = "Backup will be initiated";
	// break;
	// case 1:
	// result = `Backup completed on ${new Date(content?.completedTime)}`;
	// bucket = content?.cloudStorage;
	// break;
	// case 2:
	// result = `Backup initiated on ${new Date(content?.initiatedTime)}`;
	// break;
	// case 4:
	// result = "Backup has been Deleted";
	// break;
	// default:
	// result = "";
	// }
	// return result;
	// };

	const setStartDates = (date) => {
		finalServiceParamsNew[0].startDate = date;
		if (finalServiceParamsNew[1].startDate === "") {
			finalServiceParamsNew[1].startDate = date;
		}
		if (finalServiceParamsNew[2].startDate === "") {
			finalServiceParamsNew[2].startDate = date;
		}
		if (finalServiceParamsNew[3].startDate === "") {
			finalServiceParamsNew[3].startDate = date;
		}
		serviceParamsStateChanger(finalServiceParamsNew);
		onClick({
			target: {
				name: "gmail",
				checked: ""
			}
		});
	};

	const setEndDates = (date) => {
		finalServiceParamsNew[0].endDate = date;
		if (finalServiceParamsNew[1].endDate === "") {
			finalServiceParamsNew[1].endDate = date;
		}
		if (finalServiceParamsNew[2].endDate === "") {
			finalServiceParamsNew[2].endDate = date;
		}
		if (finalServiceParamsNew[3].endDate === "") {
			finalServiceParamsNew[3].endDate = date;
		}
		serviceParamsStateChanger(finalServiceParamsNew);
		onClick({
			target: {
				name: "gmail",
				checked: ""
			}
		});
	};

	const setBooleanChange = (booleanValue, tabType) => {
		finalServiceParamsNew[tabType][booleanValue] = !finalServiceParamsNew[tabType][booleanValue];
		serviceParamsStateChanger(finalServiceParamsNew);
		onClick({
			target: {
				name: finalServiceParamsNew[tabType].name,
				checked: ""
			}
		});
	};

	const setDate = (date, tabType, dateType) => {
		finalServiceParamsNew[tabType][dateType] = date;
		serviceParamsStateChanger(finalServiceParamsNew);
		onClick({
			target: {
				name: finalServiceParamsNew[tabType].name,
				checked: ""
			}
		});
	};

	const tabList = [
		{
			name: "gmail",
			label: "Gmail",
			url: "https://logodownload.org/wp-content/uploads/2018/03/gmail-logo-16.png",
			content: (
				<div className="pl-24 pr-8 py-8">
					<div>
						<div className="mb-16 xl:w-96">
							<label htmlFor="startDate" className="text-xs">Start Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setStartDates(event.target.value); }} value={finalServiceParamsNew[0].startDate} id="startDate" type="date" className="rounded mt-4 w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>

						<div className="mb-16 xl:w-96">
							<label htmlFor="endDate" className="text-xs">End Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setEndDates(event.target.value); }} value={finalServiceParamsNew[0].endDate} id="endDate" type="date" className="rounded mt-4 w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>
					</div>

					<div>
						<div className="mb-16 xl:w-96">
							<div className='flex items-center justify-between'>
								<label className="relative inline-flex items-center cursor-pointer">
									<input onChange={() => { setBooleanChange("includeDraft", 0); }} type="checkbox" checked={finalServiceParamsNew[0].includeDraft} />
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									<span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Include drafts</span>
								</label>
							</div>
						</div>
					</div>

					<div>
						<div className="mb-16 xl:w-96">
							<div className='flex items-center justify-between'>
								<label className="relative inline-flex items-center cursor-pointer">
									<input onChange={() => { setBooleanChange("onlySentMail", 0); }} type="checkbox" value="" checked={finalServiceParamsNew[0].onlySentMail} />
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									<span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Only sent mails</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			)
		},
		{
			name: "drive",
			label: "Drive",
			url: "https://zeevector.com/wp-content/uploads/Google-Drive-Logo-PNG.png",
			content: (
				<div className="pl-24 pr-8 py-8">
					<div>
						<div className="mb-16 xl:w-96">
							<label htmlFor="startDate" className="text-xs">Start Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setDate(event.target.value, 1, "startDate"); }} value={finalServiceParamsNew[1].startDate} id="startDate" type="date" className="rounded mt-4 w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>

						<div className="mb-16 xl:w-96">
							<label htmlFor="endDate" className="text-xs">End Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setDate(event.target.value, 1, "endDate"); }} value={finalServiceParamsNew[1].endDate} id="endDate" type="date" className="rounded mt-4 w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between w-[100%]">
						<div className="mb-16 xl:w-96">
							<div className='flex items-center justify-between'>
								<label className="relative inline-flex items-center cursor-pointer">
									<input onChange={() => { setBooleanChange("includeSharedDrive", 1); }} type="checkbox" checked={finalServiceParamsNew[1].includeSharedDrive} />
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									<span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Include shared drive</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			)
		},
		{
			name: "groups",
			label: "Group",
			url: "https://i2.wp.com/9to5google.com/wp-content/uploads/sites/4/2021/07/new-google-groups-logo.png?ssl=1",
			content: (
				<div className="pl-24 pr-8 py-8">
					<div>
						<div className="mb-16 xl:w-96">
							<label htmlFor="startDate" className="text-xs">Start Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setDate(event.target.value, 2, "startDate"); }} value={finalServiceParamsNew[2].startDate} id="startDate" type="date" className="rounded mt-4 w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>

						<div className="mb-16 xl:w-96">
							<label htmlFor="endDate" className="text-xs">End Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setDate(event.target.value, 2, "endDate"); }} value={finalServiceParamsNew[2].endDate} id="endDate" type="date" className="rounded mt-4 w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between w-[100%]">
						<div className="mb-16 xl:w-96">
							<div className='flex items-center justify-between'>
								<label className="relative inline-flex items-center cursor-pointer">
									<input onChange={() => { setBooleanChange("includeDraft", 2); }} type="checkbox" checked={finalServiceParamsNew[2].includeDraft} />
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									<span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Include drafts</span>
								</label>
							</div>
						</div>
					</div>

					<div>
						<div className="mb-16 xl:w-96">
							<div className='flex items-center justify-between'>
								<label className="relative inline-flex items-center cursor-pointer">
									<input onChange={() => { setBooleanChange("onlySentMail", 2); }} type="checkbox" checked={finalServiceParamsNew[2].onlySentMail} />
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									<span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Only sent mails</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			)
		},
		{
			name: "chat",
			label: "Chat",
			url: "https://mailmeteor.com/logos/assets/PNG/Google_Chat_Logo_512px.png",
			content: (
				<div className="pl-24 pr-8 py-8">
					<div>
						<div className="mb-16 xl:w-96">
							<label htmlFor="startDate" className="text-xs">Start Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setDate(event.target.value, 3, "startDate"); }} value={finalServiceParamsNew[3].startDate} id="startDate" type="date" className="rounded mt-4 w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>

						<div className="mb-16 xl:w-96">
							<label htmlFor="endDate" className="text-xs">End Date <span className="text-red-500 text-2xl"></span></label>
							<input onChange={(event) => { setDate(event.target.value, 3, "endDate"); }} value={finalServiceParamsNew[3].endDate} id="endDate" type="date" className="rounded mt-4  w-full border border-black px-1 py-1 focus:border-blue-600 focus:outline-none" />
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between w-[100%]">
						<div className="mb-16 xl:w-96">
							<div className='flex items-center justify-between'>
								<label className="relative inline-flex items-center cursor-pointer">
									<input onChange={() => { setBooleanChange("includChatSpace", 3); }} type="checkbox" checked={finalServiceParamsNew[3].includChatSpace} />
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									<span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Include chat space</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			)
		}
	];

	let currentTab = {};
	for (const tab of tabList) {
		if (tab.name === name) {
			currentTab = tab;
		}
	}

	return (
		<div>
			<div
				className="flex flex-col flex-grow flex-basis items-center justify-between h-full w-full text-center bg-blue-100 rounded-md"
				style={{
					padding: "3em",
					// if checked, add a border
					boxSizing: "border-box",
					boxShadow: checked ? "0 0 1px 3px #adb6ff" : "none",
					height: "20rem"
				}}
			>
				{avatar}
				<div className="m-0 my-8">
					<h2 className="font-bold text-2xl">{title}</h2>
				</div>
				<Checkbox
					checked={checked}
					onChange={handleChange}
					name={name}
					// disabled={disabled}
					inputProps={{ "aria-label": "controlled" }}
				/>
				{/* <div className="m-0 my-8">
					{contentToRender()}
				</div> */}
				{/* {bucket !== "" ? <div className="m-0 my-8"><a href={bucket} target="_blank" rel="noreferrer">Backup bucket</a></div> : ""} */}
			</div >
			<div>
				{checked
					? <div>{currentTab.content}</div>
					: <></>
				}
			</div>
		</div>
	);
};

CheckCard.propTypes = {
	title: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	content: PropTypes.object,
	avatar: PropTypes.element.isRequired,
	onClick: PropTypes.func.isRequired,
	checked: PropTypes.bool.isRequired,
	disabled: PropTypes.bool.isRequired,
	serviceParamsStateChanger: PropTypes.func.isRequired,
	finalServiceParamsNew: PropTypes.array.isRequired
};

export default CheckCard;
