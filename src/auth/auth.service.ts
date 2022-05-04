import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  // 生成 token
  createToken(user: Partial<UserEntity>) {
    return this.jwtService.sign(user);
  }

  // 登录
  async login(user: Partial<UserEntity>) {
    const token = this.createToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return { token };
  }

  // 获取用户信息
  async getUser(user: UserEntity) {
    return await this.userService.findOne(user.id);
  }
}
