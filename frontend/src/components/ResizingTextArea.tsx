import { type TextareaHTMLAttributes, useLayoutEffect, useRef } from "react";

export default function ResizingTextArea({
	children,
	...props
}: React.PropsWithChildren<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
	const textArea = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		textArea.current!.style.height = "inherit";

		textArea.current!.style.height = `${textArea.current!.scrollHeight}px`;
	});

	return (
		<textarea ref={textArea} {...props}>
			{children}
		</textarea>
	);
}
