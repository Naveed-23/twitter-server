"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const user_1 = __importDefault(require("../../services/user"));
const tweet_1 = __importDefault(require("../../services/tweet"));
const queries = {
    getAllTweets: () => tweet_1.default.getAllTweets(),
};
const mutations = {
    createTweet: async (parent, { payload }, ctx) => {
        if (!ctx.user)
            throw new Error("You are not authenticated");
        const tweet = await tweet_1.default.createTweet(Object.assign(Object.assign({}, payload), { userId: ctx.user.id }));
        return tweet;
    },
};
const extraResolvers = {
    Tweet: {
        author: (parent) => user_1.default.getUserById(parent.authorId),
    },
};
exports.resolvers = { mutations, extraResolvers, queries };
