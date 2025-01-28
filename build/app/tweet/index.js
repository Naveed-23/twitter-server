"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = void 0;
const mutations_1 = require("./mutations");
const queries_1 = require("./queries");
const resolvers_1 = require("./resolvers");
const types_1 = require("./types");
exports.Tweet = { types: types_1.types, mutations: mutations_1.mutations, resolvers: resolvers_1.resolvers, queries: queries_1.queries };
