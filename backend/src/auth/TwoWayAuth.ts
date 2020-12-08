// import * as speakeasy from 'speakeasy';
// import { updateOne } from '../repositories';
// import { User } from '../user';

// const USER = 'user';

// export class TwoFactorAuth {

//   static async twoFactorSecret(user: User): Promise<speakeasy.Key> {
//     const secret = speakeasy.generateSecret({ length: 20 });
//     user.twoFactorSecret = secret.base32;
//     await updateOne(user._id, user, USER);
//     return secret
//   }

//   static verifyToken(user: User, token: string): boolean {
//     return speakeasy.totp.verify({
//       secret: user.twoFactorSecret,
//       encoding: 'base32',
//       token: token,
//       window: 10
//     })
//   }
// }

export {} 