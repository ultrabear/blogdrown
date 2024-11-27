import Markdoc from "@markdoc/markdoc";
import { createSelector } from "@reduxjs/toolkit";
import React, { type ReactNode } from "react";

export function toRenderable(text: string): ReactNode {
	return Markdoc.renderers.react(Markdoc.transform(Markdoc.parse(text)), React);
}

export const cachedMarkdoc = createSelector(
	(text: string) => text,
	(postText) => toRenderable(postText),
);
