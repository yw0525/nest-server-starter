import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

import { UserEntity } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

import {
  AccessTokenInfo,
  AccessConfig,
  WechatError,
  WechatUserInfo,
} from './typings/auth.interface';

@Injectable()
export class AuthService {
  private accessTokenInfo: AccessTokenInfo;
  public wechatApiServer = 'https://api.weixin.qq.com';

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private httpService: HttpService,
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

  // 微信登录
  async loginWithWechat(code: string) {
    if (!code) {
      throw new BadRequestException('请输入微信授权码');
    }
    await this.getAccessToken(code);

    const user = await this.getUserByOpenid();
    if (!user) {
      // 获取用户信息，注册新用户
      const userInfo: WechatUserInfo = await this.getUserInfo();
      return this.userService.registerByWechat(userInfo);
    }
    return this.login(user);
  }

  // 通过 openid 获取用户信息
  async getUserByOpenid() {
    return await this.userService.findByOpenid(this.accessTokenInfo.openid);
  }

  // 获取微信用户信息
  async getUserInfo() {
    const result: AxiosResponse<WechatError & WechatUserInfo> =
      await lastValueFrom(
        this.httpService.get(
          `${this.wechatApiServer}/sns/userinfo?access_token=${this.accessTokenInfo.accessToken}&openid=${this.accessTokenInfo.openid}`,
        ),
      );
    if (result.data.errcode) {
      throw new BadRequestException(
        `[getUserInfo] errcode:${result.data.errcode}, errmsg:${result.data.errmsg}`,
      );
    }
    console.log('result', result.data);
    return result.data;
  }

  // 获取微信授权 Token 信息
  async getAccessToken(code: string) {
    const { WECHAT_APPID, WECHAT_APPSECRET } = process.env;

    if (!WECHAT_APPSECRET) {
      throw new BadRequestException('[getAccessToken]必须有appSecret');
    }
    if (
      !this.accessTokenInfo ||
      (this.accessTokenInfo && this.isExpires(this.accessTokenInfo))
    ) {
      // 请求accessToken数据
      const res: AxiosResponse<WechatError & AccessConfig, any> =
        await lastValueFrom(
          this.httpService.get(
            `${this.wechatApiServer}/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}&code=${code}&grant_type=authorization_code`,
          ),
        );

      if (res.data.errcode) {
        throw new BadRequestException(
          `[getAccessToken] errcode:${res.data.errcode}, errmsg:${res.data.errmsg}`,
        );
      }
      this.accessTokenInfo = {
        accessToken: res.data.access_token,
        expiresIn: res.data.expires_in,
        getTime: Date.now(),
        openid: res.data.openid,
      };
    }

    return this.accessTokenInfo.accessToken;
  }

  // 判断 token 是否过期
  isExpires(access: AccessTokenInfo) {
    return Date.now() - access.getTime > access.expiresIn * 1000;
  }
}
