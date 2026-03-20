import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { ApiResponse } from "../response/api-response.js";
import { PaginationMetadata } from "../response/pagination-metadata.js";

export function ApiOkResponseWrappedArray<TModel extends Type<unknown>>(model: TModel) {
    return applyDecorators(
        ApiExtraModels(ApiResponse, PaginationMetadata, model),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(ApiResponse) },
                    {
                        properties: {
                            data: {
                                type: "array",
                                items: { $ref: getSchemaPath(model) },
                            },
                            metadata: { $ref: getSchemaPath(PaginationMetadata) },
                        },
                    },
                ],
            },
        }),
    );
}