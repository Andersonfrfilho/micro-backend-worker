import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserAddress } from '@modules/shared/entities/user-address.entity';

@Injectable()
export class UserAddressRepository {
  constructor(
    @InjectRepository(UserAddress)
    private readonly userAddressRepository: Repository<UserAddress>,
  ) {}

  async create(userAddress: Partial<UserAddress>): Promise<UserAddress> {
    const newUserAddress = this.userAddressRepository.create(userAddress);
    return this.userAddressRepository.save(newUserAddress);
  }

  async findById(id: string): Promise<UserAddress | null> {
    return this.userAddressRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<UserAddress[]> {
    return this.userAddressRepository.find({ where: { userId } });
  }
}
