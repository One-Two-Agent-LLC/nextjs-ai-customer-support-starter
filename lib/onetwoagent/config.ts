import "server-only";
import connection from "./connection.generated.json";
export const config = connection;
export const connected = Boolean(connection.businessId && connection.publicId);
