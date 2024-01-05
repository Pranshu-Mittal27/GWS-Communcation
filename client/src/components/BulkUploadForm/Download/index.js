/*eslint-disable*/
import React from "react";
import { Box, Button } from "@mui/material";
import { config } from "../../../config";


const Download = ()=> {

    return(
        <>  
            <div className="instructions" style={{marginTop: "20px"}}>
                <div style={{float: 'left', fontSize:17, marginRight: "40px", textAlign: "left" }}>
                    <p style={{lineHeight: "30px"}}> 
                        1. To download the Sample CSV file <a href={config.bulkBackupCsvLink}>click here</a>.<br></br>
                        2. In the user Email column, fill emails of user you want to initiate the export for.<br></br>
                        3. Write yes in thecorresponding cell if you want to initiate the export for that service.<br></br>
                        4. Then Upload the csv with filled data. <br></br>
                        5. PS. - Do not change the header column <br></br>
                    </p>
                </div>
                <div>
                    <img className="zoom" src={config.referenceImages.bulkBackupImage} style={{ width: 400, height:160}} />
                </div>
            </div>
        </>
    )
}

export default Download

