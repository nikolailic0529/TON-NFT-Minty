import { useRef } from "react"
import SvgImage from "./SvgImage"

interface Data {
	message: string
	url: string
}

const DragDrop = ({ setImage }: { setImage: (value: string) => void }) => {
	const dropZoneRef = useRef<HTMLLabelElement | null>(null)

	function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault()
	}

	function handleDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault()
		if (e.dataTransfer.files.length > 0) {
			const droppedFile = e.dataTransfer.files[0]
			if (
				!droppedFile.type ||
				droppedFile.type === "" ||
				!droppedFile.type.startsWith("image/") ||
				droppedFile.size === 0
			) {
				alert("Please upload an image file")
				return
			}
			const formData = new FormData()
			formData.append("image", droppedFile)

			fetch(String(import.meta.env.VITE_API), {
				method: "POST",
				body: formData,
			})
				.then((response) => response.json())
				.then((data: Data) => setImage(data.url))
				.catch((error) => console.error(error))
		}
	}

	return (
		<div
			className="bg-[#f4fdff] flex items-center justify-center rounded-lg"
			onDragOver={handleDragOver}
			onDrop={handleDrop}>
			<label
				htmlFor="dropzone-file"
				className="flex w-80 flex-col items-center justify-center h-52 border-2 border-blue-100 border-dashed rounded-lg cursor-pointer hover:bg-blue-50"
				ref={dropZoneRef}>
				<div className="flex flex-col items-center justify-center pt-5 pb-6">
					<SvgImage />
					<p className="text-xs text-gray-500 mt-8">Drag & Drop your image here</p>
				</div>
				<input id="dropzone-file" type="file" className="hidden" />
			</label>
		</div>
	)
}

export default DragDrop
