const HttpError = require("./HttpError");

class BedRequestError extends HttpError {
    constructor(message) {
        super(message, 400);
        this.name = "BedRequestError";
    }
}

module.exports = BedRequestError;