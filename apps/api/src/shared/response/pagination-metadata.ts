import { ApiProperty } from "@nestjs/swagger";

export class PaginationMetadata {
  @ApiProperty({ example: 0 })
  page: number;

  @ApiProperty({ example: 0 })
  size: number;

  @ApiProperty({ example: 0 })
  elements: number;

  constructor(page = 0, size = 0, elements = 0) {
    this.page = page;
    this.size = size;
    this.elements = elements;
  }
}