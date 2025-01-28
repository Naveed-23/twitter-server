"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const user_1 = __importDefault(require("../../services/user"));
const redis_1 = require("../../clients/redis");
const queries = {
    verifyGoogleToken: async (parent, { token }) => {
        const resultToken = await user_1.default.verifyGoogleAuthToken(token);
        return resultToken;
    },
    getCurrentUser: async (parent, args, ctx) => {
        var _a;
        const id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id)
            return null;
        const user = await user_1.default.getUserById(id);
        return user;
    },
    getUserById: async (parent, { id }, ctx) => user_1.default.getUserById(id),
};
const extraResolvers = {
    User: {
        tweets: (parent) => {
            return db_1.prismaClient.tweet.findMany({ where: { author: { id: parent.id } } });
        },
        followers: async (parent) => {
            const result = await db_1.prismaClient.follows.findMany({ where: { following: { id: parent.id } },
                include: {
                    follower: true,
                }
            });
            return result.map((el) => el.follower);
        },
        following: async (parent) => {
            const result = await db_1.prismaClient.follows.findMany({ where: { follower: { id: parent.id } },
                include: {
                    following: true,
                }
            });
            return result.map((el) => el.following);
        },
        recommendedUsers: async (parent, _, ctx) => {
            var _a, _b;
            if (!ctx.user)
                return [];
            const cachedValue = await redis_1.redisClient.get(`RECOMMENDED_USERS:${ctx.user.id}`).catch((err) => {
                console.error("Redis get error:", err);
                return null;
            });
            if (cachedValue)
                return JSON.parse(cachedValue);
            const myFollowings = await db_1.prismaClient.follows.findMany({
                where: {
                    follower: { id: (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id },
                },
                include: {
                    following: { include: {
                            followers: {
                                include: { following: true }
                            }
                        } },
                }
            });
            const users = [];
            for (const followings of myFollowings) {
                for (const followingOfFollowedUser of followings.following.followers) {
                    if (followingOfFollowedUser.followingId !== ((_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id) && myFollowings.findIndex((e) => (e === null || e === void 0 ? void 0 : e.followingId) === followingOfFollowedUser.followingId) < 0) {
                        users.push(followingOfFollowedUser.following);
                    }
                }
            }
            await redis_1.redisClient
                .set(`RECOMMENDED_USERS:${ctx.user.id}`, JSON.stringify(users))
                .catch((err) => console.error("Redis set error:", err));
            return users;
        }
    }
};
const mutations = {
    followUser: async (parent, { to }, ctx) => {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated");
        await user_1.default.followUser(ctx.user.id, to);
        await redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    },
    unfollowUser: async (parent, { to }, ctx) => {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated");
        await user_1.default.unfollowUser(ctx.user.id, to);
        await redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }
};
exports.resolvers = { queries, extraResolvers, mutations };
