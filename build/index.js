"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
async function init() {
    const app = await (0, app_1.initServer)();
    app.listen(process.env.PORT, () => console.log(`Server started at PORT:8000`));
}
init();
