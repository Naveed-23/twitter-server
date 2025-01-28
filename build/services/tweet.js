"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../clients/db");
const redis_1 = require("../clients/redis");
class TweetService {
    static async createTweet(data) {
        const rateLimitFlag = await redis_1.redisClient.get(`RATE_LIMIT:TWEET:${data.userId}`);
        if (rateLimitFlag)
            throw new Error("Please wait....");
        const tweet = await db_1.prismaClient.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: { connect: { id: data.userId } },
            }
        });
        await redis_1.redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
        await redis_1.redisClient.del('ALL_TWEETS');
        return tweet;
    }
    static async getAllTweets() {
        const cachedTweets = await redis_1.redisClient.get('ALL_TWEETS');
        if (cachedTweets)
            return JSON.parse(cachedTweets);
        const tweets = await db_1.prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
        await redis_1.redisClient.set('ALL_TWEETS', JSON.stringify(tweets));
        return tweets;
    }
}
exports.default = TweetService;
