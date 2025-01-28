import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";

interface GoogleTokenResult {
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    azp?: string;
    name?: string;
    picture?: string; 
    given_name: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string; 
    alg?: string; 
    kid?: string;
    typ?: string;
}

class UserService {
    public static async verifyGoogleAuthToken(token: string){
        console.log("1");
        const googleToken = token;
        const googleOauthURL = new URL('https://oauth2.googleapis.com/tokeninfo')
        googleOauthURL.searchParams.set('id_token', googleToken);
        console.log("2");

        const { data } = await axios.get<GoogleTokenResult>(googleOauthURL.toString(), {
            responseType: 'json',
        })
        console.log("3");

        let user;
    
    try {
        // Try fetching the user from the database
        user = await prismaClient.user.findUnique({
            where: { email: data.email },
        });
        console.log("4");

        // If user doesn't exist, create a new one
        if (!user) {
            user = await prismaClient.user.create({
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
        const userToken = JWTService.generateTokenForUser(user);
        console.log("6");

        return userToken;

    } catch (error) {
        // Catch any database-related errors (e.g., if the Prisma query fails)
        console.error("Error while verifying user:", error);
        throw new Error('Failed to verify user or access the database');
    }
}

    public static getUserById(id: string) {
        
        return prismaClient.user.findUnique({ where: { id }});
    }

    public static followUser(from: string, to: string) {
        return prismaClient.follows.create({
            data: {
                follower: { connect: { id: from }},
                following: { connect : { id: to }}
            },
        });
    }

    public static unfollowUser(from: string, to: string) {
        return prismaClient.follows.delete({
            where: { followerId_followingId: { followerId: from, followingId: to}},
        });
    }

}

export default UserService;