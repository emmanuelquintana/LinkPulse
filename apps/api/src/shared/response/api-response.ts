import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetadata } from "./pagination-metadata.js";

export class ApiResponse<TData = unknown> {
  @ApiProperty({ example: "LP_API_200" })
  code!: string;

  @ApiProperty({ example: "Operation Successful" })
  message!: string;

  @ApiProperty({ example: "c49c5368e1c7a6b5" })
  traceId!: string;

  @ApiProperty({ type: Object, nullable: true })
  data!: TData | null;

  @ApiProperty({ type: PaginationMetadata })
  metadata!: PaginationMetadata;

  constructor(init: ApiResponse<TData>) {
    this.code = init.code;
    this.message = init.message;
    this.traceId = init.traceId;
    this.data = init.data;
    this.metadata = init.metadata;
  }
}