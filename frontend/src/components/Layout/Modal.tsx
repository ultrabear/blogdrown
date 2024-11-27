import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface Closer {
	close(): void;
}

function Modal({
	Component,
	close,
	root,
}: { Component: React.FC<Closer>; root: Element; close: () => void }) {
	const modalInner = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const outerClick = (e: MouseEvent) => {
			if (!(e.target && modalInner.current?.contains?.(e.target as Node))) {
				close();
			}
		};

		const escapeKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				close();
			}
		};

		document.addEventListener("mouseup", outerClick);
		document.addEventListener("keydown", escapeKey);

		return () => {
			document.removeEventListener("mouseup", outerClick);
			document.removeEventListener("keydown", escapeKey);
		};
	});

	return createPortal(
		<div className="ModalRoot">
			<div className="ModalItem" ref={modalInner}>
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
