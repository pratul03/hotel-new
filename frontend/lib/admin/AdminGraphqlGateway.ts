import axiosInstance from "@/lib/axios";

export class AdminGraphqlError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AdminGraphqlError";
  }
}

export class AdminGraphqlGateway {
  async request<T>(
    operationName: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const documentOperationNameMatch = query.match(
      /\b(?:query|mutation|subscription)\s+([_A-Za-z][_0-9A-Za-z]*)/,
    );
    const documentOperationName = documentOperationNameMatch?.[1];

    const requestPayload: {
      query: string;
      variables?: Record<string, unknown>;
      operationName?: string;
    } = {
      query,
      variables,
    };

    if (documentOperationName) {
      requestPayload.operationName = documentOperationName;
    }

    const { data } = await axiosInstance.post("/graphql", requestPayload);

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      throw new AdminGraphqlError(
        first?.message || "Admin GraphQL request failed",
        data.errors,
      );
    }

    const payload = data?.data?.[operationName];
    if (payload === undefined) {
      throw new AdminGraphqlError(
        `Operation ${operationName} returned no payload`,
        data,
      );
    }

    return payload as T;
  }
}

export const adminGraphqlGateway = new AdminGraphqlGateway();
