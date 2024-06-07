import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express"
import multer from "multer"
import bodyParser from "body-parser"
import cors from "cors"
import { deploy_item } from "./deploy-item";

dotenv.config();

const app: Express = express()
app.use(cors())
app.use(bodyParser.json())
app.use("/public", express.static("public"))

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public")
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname)
	},
})

const upload = multer({ storage: storage })

app.post("/upload", upload.single("image"), async function (req: Request, res: Response) {
	if (req.file) {
		// const {imageUrl, collectionLink} = {imageUrl: 'null', collectionLink: 'null'};
		const {imageUrl, collectionLink} = await deploy_item(`./public/${req.file.filename}`);

		res.status(200).json({
			message: "Image uploaded and deployed",
			url: imageUrl,
			collectionLink: collectionLink,
		})
	} else {
		res.status(400).json({ error: "No file uploaded" })
	}
})

app.listen(3000, () => {
	console.log("Express server started on port 3000")
})
