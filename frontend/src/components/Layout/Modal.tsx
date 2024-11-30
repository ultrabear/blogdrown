import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface Closer {
	close(): void;
}

type ModalProps<T> = {
	Component: React.FC<Closer & T>;
	root: Element;
	close: () => void;
	extraProps: T;
};

function Modal<T>({ Component, close, root, extraProps }: ModalProps<T>) {
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
				<Component close={close} {...extraProps} />
			</div>
		</div>,
		root,
	);
}

type ModalButtonProps<T> = React.PropsWithChildren<{
	Component: React.FC<Closer & T>;
	root: Element;
	extraProps?: T;
}>;

export function ModalButton(props: ModalButtonProps<void>): JSX.Element;

export function ModalButton<T>(
	props: ModalButtonProps<T> & { extraProps: T },
): JSX.Element;

export function ModalButton<T>({
	Component,
	root,
	children,
	extraProps,
}: ModalButtonProps<T>) {
	const [clicked, setClicked] = useState(false);

	return (
		<div className="link obvious">
			<button type="button" onClick={() => setClicked(true)}>
				{children}
			</button>
			{clicked && (
				<Modal
					close={() => setClicked(false)}
					Component={Component}
					root={root}
					extraProps={extraProps}
				/>
			)}
		</div>
	);
}
