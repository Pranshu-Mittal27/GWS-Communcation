import { Button, Container, Grid, Tooltip } from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";
import StepperForm from "../../components/StepperForm";
import { SearchBar } from "../../components";
import { Box } from "@mui/system";
import { config } from "../../config";
import CloseIcon from "@mui/icons-material/Close";
import { useDebounce } from "../../hooks";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import domainIcon from "../../assets/img/icons/unicons/domainIcon.png";
import NoResultsFound from "../../assets/img/illustrations/no-results-found.json";
import Lottie from "lottie-react";
import mailIcon from "../../assets/img/icons/unicons/mailIcon.png";

const AddNewDomain = () => {
	const { value: dataSearch, debouncedValue: deferredDataSearch, setValue: setDataSearch } = useDebounce("", 500);
	const [addDomain, setAddDomain] = useState(false);
	const [title, setTitle] = useState("");

	const { data: domainData, refetch: refetchDomainData } = useQuery({
		queryKey: ["domains"],
		queryFn: () =>
			axios.get(config.urls.domains.get())
				.then((response) => ((response.status === 200) || (response.status === 304)) ? response.data : [])
	});

	// fetch new data when the model is closed
	useEffect(() => {
		if (addDomain === false) {
			refetchDomainData();
		}
	}, [addDomain, refetchDomainData]);

	const filteredData = useMemo(() => {
		if (Array.isArray(domainData) && (domainData.length > 0)) {
			return domainData.filter((data) => data.domain.toLowerCase().includes(deferredDataSearch.toLowerCase()));
		} else {
			return [];
		}
	}, [deferredDataSearch, domainData]);

	return (
		<>
			{!addDomain &&
			<>
				<h1 className="w-fit pt-3 pb-3 px-5 pageTitle bg-blue-500 text-white">Domains Available</h1>
				<Container sx={{ minWidth: "100%", padding: "0 3rem !important" }} >
					<Box display="flex" justifyContent="space-between" marginY="1rem">
						<SearchBar
							query={dataSearch}
							setQuery={(e) => {
								e.preventDefault();
								setDataSearch(e.target.value);
							}}
							placeHolderForSearchBar={"Domain"}
						/>
						<Tooltip title="Add New Domain">
							<Button onClick={() => { setAddDomain(!addDomain); }} sx={{ padding: 0 }}>
								<img src={config.icons.AddDomain} alt="add domain" width="35px" />
							</Button>
						</Tooltip>
					</Box>
					<Grid spacing={2} container sx={{ height: "75vh", overflow: "scroll" }}>
						{
							(filteredData.length === 0)
								? <Lottie style={{ margin: "auto", width: "500px" }} animationData={NoResultsFound} loop={true} rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} />
								: filteredData
									.map((data, i) => {
										return (
											<Grid item key={i} xs={12} sm={6} md={4} lg={3}>
												<div
													className={"bg-white p-3 w-full flex flex-col rounded-md dark:bg-gray-800 cursor-pointer shadow"}
												>
													<div className="flex xl:flex-row flex-col items-center font-medium text-gray-900 dark:text-white border-gray-200 border-opacity-75 dark:border-gray-700 w-full">
														<img src={domainIcon} className="w-7 h-7 mr-2 rounded-full" alt="profile" referrerPolicy="no-referrer" />
														<h2 className="text-lg">{data.domain}</h2>
													</div>
													<div className="flex flex-col items-start w-full border-b mb-2 mt-2 pb-2">
														<div className="text-xs flex items-center">
															<p className="text-xs mr-1 text-gray-400" >Parent domain:</p>
															<p className="text-sm text-gray-400">{data.parentDomain}</p>
														</div>
														<div className="text-xs flex items-center">
															<p className="text-xs mr-1 text-gray-400" >Added by:</p>
															<p className="text-sm text-gray-400">{data.creator}</p>
														</div>
														<div className="text-xs flex items-center">
															<p className="text-xs mr-1 text-gray-400" >Added on:</p>
															<p className="text-sm text-gray-400">{data.createdAt}</p>
														</div>

													</div>
													<div className="flex items-center w-full">
														<div className="flex items-center justify-center text-xs py-1 px-2 mx-auto xl:ml-auto leading-none dark:bg-gray-900 bg-blue-100 text-blue-500 rounded-md overflow-hidden text-ellipsis white-space-nowrap">
															<img src={mailIcon} alt="email" width="13px" className="mr-1" />
															{`Admin: ${data.adminEmail}`}
														</div>
													</div>
												</div>
											</Grid>
										);
									})
						}
					</Grid>
				</Container>
			</>}
			{addDomain &&
				(<Container style={{ textAlign: "center", backgroundColor: "white", margin: "auto", minWidth: "90vw" }}>
					<Box display="flex" justifyContent="space-between" alignItems="center" paddingY="1rem" >
						<h2 style={{ fontWeight: "500" }}>{title}</h2>
						<CloseIcon className="cursor-pointer" onClick={() => { setAddDomain(!addDomain); }} />
					</Box>
					<div
						className="card-body"
						style={{
							display: "flex",
							flexDirection: "column"
						}}
					>
						<StepperForm setTitle={setTitle} setAddDomain={setAddDomain} />
					</div>
				</Container>)
			}
		</>
	);
};

export default AddNewDomain;
