import { SetMetadata } from "@nestjs/common";

export const IGNORE_TRANSFORM_KEY = "ignore_transform";
export const IgnoreTransform = () => SetMetadata(IGNORE_TRANSFORM_KEY, true);
