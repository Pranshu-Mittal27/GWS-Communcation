/*eslint-disable*/

import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import PropTypes from "prop-types";

import Download from "./Download";
import FileUpload from "./Upload";

const BulkBackupForm = ({onModalClick, bulkRequestBackupSetter}) => {

    const getCsvData = (data) => {
        console.log("inside getcsvdata")
        bulkRequestBackupSetter(data)
        console.log(data)
    };

    return (
        <>
            <div style={{marginLeft:80}}  className='m-16'>
                <Download/>
                <FileUpload getCsvData = {getCsvData} />
                <Box display={"flex"} justifyContent={"center"} height={"100%"} style={{marginTop:108, marginBottom:50, marginLeft:400}}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={(event) => { onModalClick(event); }}
                    >
                        Submit
                    </Button>
                </Box>
            </div>
        </>
    )
}

BulkBackupForm.propTypes = {
	onModalClick: PropTypes.func.isRequired,
    bulkRequestBackupSetter: PropTypes.func.isRequired
};

export default BulkBackupForm