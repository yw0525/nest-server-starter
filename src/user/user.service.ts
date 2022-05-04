import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { WechatUserInfo } from '../auth/typings/auth.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  // 账号密码注册
  async register(createUser: CreateUserDto) {
    const { username } = createUser;

    const existUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userRepository.create(createUser);
    return await this.userRepository.save(newUser);
  }

  // 查询用户
  async findOne(id: number) {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  // 微信注册
  async registerByWechat(userInfo: WechatUserInfo) {
    const { nickname, openid, headimgurl } = userInfo;
    const newUser = await this.userRepository.create({
      nickname,
      openid,
      avatar: headimgurl,
    });
    return await this.userRepository.save(newUser);
  }

  // 通过 Openid 查询用户
  async findByOpenid(openid: string) {
    return await this.userRepository.findOne({ where: { openid } });
  }
}
