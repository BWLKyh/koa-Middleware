import { Context } from 'koa';
import * as argon2 from 'argon2';
import { getManager } from 'typeorm';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../constants';

import { User } from '../entity/user';
import { UnauthorizedException } from '../exceptions';
export default class AuthController {
  public static async login(ctx: Context) {
    const userRepository = getManager().getRepository(User);
    const body:any = ctx.request.body
    const user = await userRepository
      .createQueryBuilder()
      .where({ name: body.name })
      .addSelect('User.password')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('用户名不存在');
    } else if (await argon2.verify(user.password, body.password)) {
      ctx.status = 200;
      ctx.body = { token: jwt.sign({ id: user.id }, JWT_SECRET) };
    } else {
      throw new UnauthorizedException('密码错误');
    }
  }

  public static async register(ctx: Context) {
    const userRepository = getManager().getRepository(User);

    const newUser = new User();
    const body:any = ctx.request.body
    newUser.name = body.name;
    newUser.email = body.email;
    newUser.password = await argon2.hash(body.password);

    // 保存到数据库
    const user = await userRepository.save(newUser);

    ctx.status = 201;
    ctx.body = user;
  }
}
