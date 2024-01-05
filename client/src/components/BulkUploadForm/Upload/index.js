/*eslint-disable*/

import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import notify from "../../Toast";
import Papa from "papaparse";

const FileUpload = ({ getCsvData }) => {

    const approvedHeaders = ["User Email", "Gmail", "Drive", "Chat"];
    const bulkBackupFixData = [{
        name: "gmail",
        startDate: "",
        endDate: "",
        includeDraft: true,
        onlySentMail: false
    },
    {
        name: "drive",
        startDate: "",
        endDate: "",
        includeSharedDrive: true
    },
    {
        name: "groups",
        startDate: "",
        endDate: "",
        includeDraft: true,
        onlySentMail: false
    },
    {
        name: "chat",
        startDate: "",
        endDate: "",
        includChatSpace: true
    }]

    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("");

    const saveFile = (e) => {
        setFile(e.target.files[0]);
        setFileName(e.target.files[0].name);
    };

    const uploadFile = async (e) => {
        let csvData = []
        //check csv file
        if(fileName.split(".")[1] != "csv"){
            notify.error("Uploaded File is not csv");
            return
        }
        console.log("file uploaded is csv")

        Papa.parse(file, {header: false, skipEmptyLines: true,
            complete: function (results) {
                csvData = results.data
                console.log("csvData : ", csvData)

                if(csvData[0].toString() !== approvedHeaders.toString()){
                    notify.error("Uploaded File's headers are not correct");
                    return
                }
                notify.success("File successfully Uploaded");

                let bulkRequestBackup = []
                for(let i=1; i<csvData.length; i++){
                    let requestBackupObject = {
                        accountEmail: csvData[i][0],
                        services: {
                            drive: false,
                            gmail: false,
                            chat: false,
                            groups: false
                        }
                    }

                    if(csvData[i][1] !== ""){
                        if(csvData[i][1].toLowerCase() === "yes" || csvData[i][1].toLowerCase() === "true" || csvData[i][1].toLowerCase() === "y"){
                            requestBackupObject.services.gmail = bulkBackupFixData[0];
                        } else if(csvData[i][1].toLowerCase() !== "no" && csvData[i][1].toLowerCase() !== "false" && csvData[i][1].toLowerCase() !== "n"){
                            requestBackupObject.services.gmail = "Entered Value in Gmail Column is not valid"
                        }
                    }
                    if(csvData[i][2] !== ""){
                        if(csvData[i][2].toLowerCase() === "yes" || csvData[i][2].toLowerCase() === "true" || csvData[i][2].toLowerCase() === "y"){
                            requestBackupObject.services.drive = bulkBackupFixData[1];
                        } else if(csvData[i][2].toLowerCase() !== "no" && csvData[i][2].toLowerCase() !== "false" && csvData[i][2].toLowerCase() !== "n"){
                            requestBackupObject.services.drive = "Entered Value in Drive Column is not valid"
                        }
                    }
                    if(csvData[i][3] !== ""){
                        if(csvData[i][3].toLowerCase() === "yes" || csvData[i][3].toLowerCase() === "true" || csvData[i][3].toLowerCase() === "y"){
                            requestBackupObject.services.chat = bulkBackupFixData[3];
                        } else if(csvData[i][3].toLowerCase() !== "no" && csvData[i][3].toLowerCase() !== "false" && csvData[i][3].toLowerCase() !== "n"){
                            requestBackupObject.services.chat = "Entered Value in Chat Column is not valid"
                        }
                    }

                    bulkRequestBackup.push(requestBackupObject)
                }
                console.log("bulkRequestBackup : ", bulkRequestBackup)
                getCsvData(bulkRequestBackup)
            },
        });
    };


    return (
    <div className="App" style={{float:'left', marginLeft :80, marginTop:70}}>
        <input type="file" onChange={saveFile} className="font-medium" />
        <Box display={"flex"} justifyContent={"center"} height={"100%"} style={{marginTop:20, marginRight:195}}>
            <Button
                variant="contained"
                color="primary"
                onClick={uploadFile}
            >
                Upload File
            </Button>
        </Box>
    </div>
    );
}
 
export default FileUpload;