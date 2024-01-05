const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
// const compression = require("compression");
const admin = require("firebase-admin");
// const serviceAccount = require("./FirebaseAdminSDK.json");
const serviceAccount = require("./apiKey.json");

dotenv.config();

const { api } = require("./api");
const { config } = require("./config");
// const { InitDB } = require("./db");

// InitDB(config.MONGO_URL);

const app = express();

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

//used for accesing the backend across browsers
const corsOptions = {
	origin: config.ORIGIN_URL,
	credentials: true,
	optionsSuccessStatus: 200
};

// builidng app using the congifurations
app.use(cors(corsOptions));
app.use(express.json());
// app.use(compression());

// api routes v1
app.use("/api/v1", api(config));

app.listen(config.PORT, () => {
	console.log(`[listen] server is listening on ${config.PORT}`);
});
