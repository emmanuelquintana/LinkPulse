import { ApiResponse } from "./api-response.js";
import { PaginationMetadata } from "./pagination-metadata.js";

export class ApiResponseBuilder<TData = unknown> {
  private _code = "LP_API_200";
  private _message = "Operation Successful";
  private _traceId = "";
  private _data: TData | null = null;
  private _metadata = new PaginationMetadata();

  code(code: string): this {
    this._code = code;
    return this;
  }

  message(message: string): this {
    this._message = message;
    return this;
  }

  traceId(traceId: string): this {
    this._traceId = traceId;
    return this;
  }

  data(data: TData | null): this {
    this._data = data;
    return this;
  }

  metadata(metadata: PaginationMetadata): this {
    this._metadata = metadata;
    return this;
  }

  build(): ApiResponse<TData> {
    return new ApiResponse<TData>({
      code: this._code,
      message: this._message,
      traceId: this._traceId,
      data: this._data,
      metadata: this._metadata,
    } as ApiResponse<TData>);
  }

  static create<T>(): ApiResponseBuilder<T> {
    return new ApiResponseBuilder<T>();
  }
}