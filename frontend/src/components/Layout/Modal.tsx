import { useState } from "react";
import { createPortal } from "react-dom";

export interface Closer {
	close(): void;
}

function Modal({
	Component,
	close,
	root,
}: { Component: React.FC<Closer>; root: Element; close: () => void }) {
	return createPortal(
		<div
			className="ModalRoot"
			onClick={(e) => {
				e.stopPropagation();
				close();
			}}
		>
			<div className="ModalItem" onClick={(e) => e.stopPropagation()}>
				<Component close={close} />
			</div>
		</div>,
		root,
	);
}

export function ModalButton({
	Component,
	root,
	children,
}: React.PropsWithChildren<{ Component: React.FC<Closer>; root: Element }>) {
	const [clicked, setClicked] = useState(false);

	return (
		<div onClick={() => setClicked(true)}>
			<span className="link obvious">
				<button type="button">{children}</button>
			</span>
			{clicked && (
				<Modal
					close={() => setClicked(false)}
					Component={Component}
					root={root}
				/>
			)}
		</div>
	);
}
