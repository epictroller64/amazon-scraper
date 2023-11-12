export class AmazonError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.name = "AmazonError"
        this.statusCode = statusCode
    }

}