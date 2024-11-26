import { useEffect, useState } from "react";

const frames = [".", "..", "..", "...", "...", "..."];

export function LoadingText({ text }: { text?: string }) {
	const [animation, setAnimation] = useState(0);

	useEffect(() => {
		setTimeout(() => setAnimation((animation + 1) % frames.length), 200);
	}, [animation]);

	return (
		<div className="Loading Text">
			{text != null ? text : "Loading component"}
			{frames[animation]!}
		</div>
	);
}
