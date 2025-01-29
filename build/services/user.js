"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../clients/db");
const jwt_1 = __importDefault(require("./jwt"));
class UserService {
    static async verifyGoogleAuthToken(token) {
        console.log("1");
        if (!token) {
            throw new Error("No Google authentication token provided.");
        }
        const googleToken = token;
        const googleOauthURL = new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOauthURL.searchParams.set('id_token', googleToken);
        console.log("2");
        let data;
        try {
            const response = await axios_1.default.get(googleOauthURL.toString(), {
                responseType: 'json',
            });
            data = response.data;
        }
        catch (error) {
            console.error("Error fetching Google token info:", error);
            throw new Error("Invalid Google token or failed to fetch token info");
        }
        console.log("3");
        if (!data.email) {
            throw new Error("Invalid Google token: Email not found");
        }
        let user;
        try {
            // Try fetching the user from the database
            user = await db_1.prismaClient.user.findUnique({
                where: { email: data.email },
            });
            console.log("4");
            // If user doesn't exist, create a new one
            if (!user) {
                user = await db_1.prismaClient.user.create({
                    data: {
                        email: data.email,
                        firstName: data.given_name,
                        lastName: data.family_name,
                        profileImageURL: data.picture,
                    }
                });
            }
            console.log("5");
            // Generate token for the user if they exist or were just created
            const userToken = jwt_1.default.generateTokenForUser(user);
            console.log("6");
            return userToken;
        }
        catch (error) {
            // Catch any database-related errors (e.g., if the Prisma query fails)
            console.error("Error while verifying user:", error);
            throw new Error('Failed to verify user or access the database');
        }
    }
    static getUserById(id) {
        return db_1.prismaClient.user.findUnique({ where: { id } });
    }
    static followUser(from, to) {
        return db_1.prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } }
            },
        });
    }
    static unfollowUser(from, to) {
        return db_1.prismaClient.follows.delete({
            where: { followerId_followingId: { followerId: from, followingId: to } },
        });
    }
}
exports.default = UserService;
