import { useEffect, useRef, useState } from "react"
import DragDrop from "./Drag&Drop"
// import SuccessCard from "./SuccessCard"
import axios from "axios"
import './index.css'
import { useNFTCollectionContract} from "../../hooks/useNFTCollectionContract";
import { useTonConnect } from "../../hooks/useTonConnect";

interface Data {
	message: string
	url: string,
	metadataIpfsHash: string,
}

const NFTMinter = () => {
	const [image, setImage] = useState<string>("")
	const [metadataIpfsHash, setMetadataIpfsHash] = useState<string>("")
	const [isLoading, setIsLoading] = useState(false)
	const [isUploaded, setIsUploaded] = useState(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const { connected } = useTonConnect();
  	const { itemCount, ownerAddress, address, sendTopUpBalance, sendChangeContent } = useNFTCollectionContract();

	const handleFileButtonClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
		const files = e.target.files
		setIsLoading(true)
		try {
			if (files && files.length > 0) {
				const file = files[0]
				if (!file.type || file.type === "" || !file.type.startsWith("image/") || file.size === 0) {
					alert("Please upload an image file")
					return
				}
				const formData = new FormData()
				formData.append("image", file)

				const response = await axios.post(`${import.meta.env.VITE_API}/upload`, formData)
				if (response.status === 200) {
					const data = (response.data) as Data
					setImage(data.url)
					setMetadataIpfsHash(data.metadataIpfsHash)
				} else {
					throw new Error("Image upload failed")
				}
				// fetch(`${import.meta.env.VITE_API}/upload`)
				// .then(response => {
				// 	if (response.ok) {
				// 		throw new Error("Image upload failed")
				// 	}
				// 	return response.json();
				// })
				// .then(data => {
				// 	const _data = data as Data
				// 	setImage(_data.url)
				// 	setMetadataIpfsHash(data.metadataIpfsHash)
				// })
				// .catch(error => {
				// 	console.error('Error:', error);
				// });
			}
		} catch (error) {
			console.log(error)
			alert("Something went wrong")
		}
	}

	useEffect(() => {
		let timeoutId: any
		if (image) {
			setIsLoading(true)
			timeoutId = setTimeout(() => {
				setIsLoading(false)
				if (image) {
					setIsUploaded(true)
				}
			}, 1000)
		}
		return () => {
			clearTimeout(timeoutId)
		}
	}, [image])

	return isLoading ? (
		<div className="flex items-center justify-center h-auto">
			<div className="w-full bg-white rounded-xl shadow-[0_3px_10px_rgb(0,0,0,0.2)] overflow-hidden">
				<div className="h-32 flex flex-col items-center justify-center">
					<h1 className="mr-auto ml-8 font-semibold text-gray-700 text-xl mb-6">Uploading...</h1>
					<div className="w-80 h-1 bg-gray-300 rounded">
						<div className="h-full bg-blue-500 animate-progress"></div>
					</div>
				</div>
			</div>
		</div>
	) : isUploaded ? (
		<div className="h-auto flex flex-col justify-center items-center relative">
			<div className="w-full pb-8 bg-white rounded-xl shadow-[0_3px_10px_rgb(0,0,0,0.2)] overflow-hidden flex flex-col justify-center items-center">
				<h1 className="font-semibold text-green-600 text-center my-4 text-xl">Uploaded Successfully!</h1>
				<img src={image} alt={image} className="w-80 h-72 rounded-2xl my-4" />
				<div className="relative flex items-center mt-2">
					<h4 className="font-semibold text-gray-700 text-center my-4 text-xs">{image}</h4>
				</div>
			</div>
		</div>
	) : connected ? (
		<div className="h-auto flex flex-col justify-center items-center relative">
			<div className="w-full h-auto mx-auto bg-white rounded-xl shadow-[0_3px_10px_rgb(0,0,0,0.2)] overflow-hidden">
				<div className="px-8 py-4 flex flex-col items-center">
					<div className="w-auto">
						<div className="my-0">
							<h4 className="font-semibold text-gray-400 text-xs"> Contract Address: </h4>
							<h5 className="font-semibold text-gray-700 text-xs"> {address ? address.toString() : '___'} </h5>
						</div>
						<div className="my-1">
							<h4 className="font-semibold text-gray-400 text-xs"> Current Item Count: </h4>
							<h5 className="font-semibold text-gray-700 text-xs"> {itemCount? itemCount.toString() : '___'} </h5>
						</div>
						<div className="my-1">
							<h4 className="font-semibold text-gray-400 text-xs"> Owner Address: </h4>
							<h5 className="font-semibold text-gray-700 text-xs"> {ownerAddress? ownerAddress.toString() : '___'} </h5>
						</div>
					</div>
				</div>
				<div className="px-8 py-4 flex flex-col items-center">
					<h1 className="font-semibold text-gray-700 text-xl my-4">Upload your image</h1>
					<h4 className="text-gray-500 text-xs">File should be Jpeg, Png...</h4>
					<div className="flex items-center justify-center mt-4">
						<DragDrop setImage={setImage} />
					</div>
					<p className="text-gray-500 text-xs my-4">Or</p>
					<form action="/upload" method="post" encType="multipart/form-data">
						<input
							type="file"
							name="image"
							ref={fileInputRef}
							accept="image/*"
							style={{ display: "none" }}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								handleFileInputChange(e).catch((e) => console.error(e))
							}}
							multiple
						/>
					</form>
					<button
						className="bg-blue-600 mb-3 text-white px-4 py-2 rounded-lg text-sm"
						onClick={handleFileButtonClick}>
						Choose a File
					</button>
				</div>
			</div>
			<footer className="text-gray-500 text-xs absolute bottom-5">
				{/* created by Lucas Coppola - devChallenges.io */}
			</footer>
		</div>
	) : (
		<div className="h-48 flex flex-col justify-center items-center relative">
			<div className="w-full h-auto mx-auto bg-white rounded-xl shadow-[0_3px_10px_rgb(0,0,0,0.2)] overflow-hidden">
				<div className="px-8 py-4 flex flex-col items-center">
					<h1 className="font-semibold text-gray-700 text-xl my-4">Connect your wallet</h1>
				</div>
			</div>
		</div>
	)
}

export default NFTMinter
